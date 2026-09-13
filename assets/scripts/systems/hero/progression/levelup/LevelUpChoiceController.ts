/**
 * @architecture TonightDefense V1.0
 * @owner progression
 * @module levelup
 *
 * 新规则：
 * 三选一不再由“经验升级”触发，
 * 而由“每个小关通过”触发。
 */
import {
    _decorator,
    Component,
    Node,
} from 'cc';

import {
    getCharacterById,
} from '../../character/data/CharacterCatalog';

import {
    PartyState,
} from '../../character/party/PartyState';

import {
    RecruitService,
} from '../recruitment/RecruitService';

import {
    AutoAttackController,
} from '../../../battle/combat/AutoAttackController';

import {
    EnemyController,
} from '../../../battle/enemy/EnemyController';

import {
    MainHeroController,
} from '../../character/player/MainHeroController';

import {
    VirtualJoystick,
} from '../../../../ui/input/VirtualJoystick';

import {
    CompanionBattleController,
} from '../../character/companion/CompanionBattleController';

import {
    HeroSkillRuntime,
} from '../../skill/runtime/HeroSkillRuntime';

import {
    StatusEffectSystem,
} from '../../skill/effect/StatusEffectSystem';

import {
    ProfessionSkillRollSource,
} from '../../skill/upgrade/HeroSkillUpgradeService';

import {
    HeroRunUpgradeService,
} from './HeroRunUpgradeService';

import {
    WaveRewardKind,
} from './WaveRewardSchedule';

import {
    RecruitChoicePanel,
} from '../../../../ui/panels/recruit/RecruitChoicePanel';

import {
    SkillChoicePanel,
} from '../../../../ui/panels/skill/SkillChoicePanel';

import {
    HeroSelectionState,
} from '../../character/selection/HeroSelectionState';

import {
    getProfessionById,
} from '../../profession/definition/ProfessionCatalog';

const { ccclass } =
    _decorator;

@ccclass('LevelUpChoiceController')
export class LevelUpChoiceController
extends Component {
    static instance:
        LevelUpChoiceController | null =
        null;

    private readonly party =
        new PartyState();

    private recruitService!:
        RecruitService;

    private overlay:
        Node | null = null;

    private rewardComplete:
        (() => void) | null =
        null;

    private currentWave = 0;

    private enemyWasEnabled =
        false;

    private attackWasEnabled =
        false;

    private heroWasEnabled =
        false;

    private joystickWasEnabled =
        false;

    private companionWasEnabled =
        false;

    private skillRuntimeWasEnabled =
        false;

    private statusEffectWasEnabled =
        false;

    onLoad(): void {
        LevelUpChoiceController.instance =
            this;

        this.party
            .resetHumanPlayers(
                ['玩家1'],
            );

        this.recruitService =
            new RecruitService(
                this.party,
            );
    }

    onDestroy(): void {
        if (
            LevelUpChoiceController
                .instance ===
            this
        ) {
            LevelUpChoiceController.instance =
                null;
        }
    }

    /**
     * ChapterWaveController 的正式入口。
     */
    showWaveReward(
        waveNumber:
            number,
        rewardKind:
            WaveRewardKind,
        onComplete:
            () => void,
    ): void {
        if (this.overlay) {
            return;
        }

        this.currentWave =
            waveNumber;

        this.rewardComplete =
            onComplete;

        this.pauseBattle();

        if (
            rewardKind ===
                'recruit' &&
            !this.party.isFull
        ) {
            this.showRecruitChoice();
            return;
        }

        /**
         * 队伍已经满时，即使碰到旧的招募波，
         * 也自动转成技能强化，不浪费奖励。
         */
        this.showSkillChoice();
    }

    /**
     * 兼容旧代码。
     * 以后经验系统不会再调用这个方法。
     */
    enqueueChoices(
        count = 1,
    ): void {
        if (
            count <= 0 ||
            this.overlay
        ) {
            return;
        }

        this.showWaveReward(
            0,
            this.party.isFull
                ? 'skill'
                : 'recruit',
            () => {},
        );
    }

    private showRecruitChoice(): void {
        void this.openRecruitChoice();
    }

    /**
     * RecruitChoicePanel 自己负责招募 UI。
     * LevelUpChoiceController 只负责：
     * 1. 获取三个候选伙伴
     * 2. 执行招募
     * 3. 通知人物系统生成伙伴
     * 4. 结束本次奖励选择
     */
    private async openRecruitChoice():
        Promise<void> {
        const options =
            this.recruitService
                .rollOptions();

        if (
            options.length <= 0
        ) {
            this.showSkillChoice();
            return;
        }

        const canvas =
            this.node.parent;

        if (!canvas) {
            this.finishReward();
            return;
        }

        let selected =
            false;

        const overlay =
            await RecruitChoicePanel
                .create(
                    canvas,
                    options,
                    (
                        companion,
                    ) => {
                        if (selected) {
                            return;
                        }

                        selected = true;

                        const success =
                            this.recruitService
                                .recruit(
                                    companion,
                                );

                        if (!success) {
                            selected = false;
                            return;
                        }

                        CompanionBattleController
                            .instance
                            ?.spawnCompanion(
                                companion,
                            );

                        console.log(
                            `[今晚守城] 小关${this.currentWave} 招募：${companion.name}`,
                        );

                        this.finishReward();
                    },
                );

        /**
         * 只有完整角色预览与三张卡全部准备完，
         * 才把面板登记为当前 Overlay。
         */
        this.overlay =
            overlay;
    }

    private showSkillChoice(): void {
        void this.openSkillChoice();
    }

    /**
     * SkillChoicePanel 只负责本局成长三选一卡片 UI。
     *
     * LevelUpChoiceController 负责：
     * - 生成技能 / 全队属性混合候选
     * - 通过 HeroRunUpgradeService 应用唯一成长状态
     * - 结束奖励流程
     */
    private async openSkillChoice():
        Promise<void> {
        const sources =
            this.getSkillRollSources();

        const options =
            HeroRunUpgradeService
                .rollThreeOptions(
                    sources,
                );

        if (
            options.length <= 0
        ) {
            this.finishReward();
            return;
        }

        const canvas =
            this.node.parent;

        if (!canvas) {
            this.finishReward();
            return;
        }

        let selected =
            false;

        const overlay =
            await SkillChoicePanel
                .create(
                    canvas,
                    options,
                    (
                        option,
                    ) => {
                        if (selected) {
                            return;
                        }

                        selected = true;

                        const success =
                            HeroRunUpgradeService
                                .apply(
                                    option,
                                );

                        if (!success) {
                            selected = false;

                            console.warn(
                                '[今晚守城] 本局成长三选一应用失败',
                                option,
                            );

                            return;
                        }

                        if (option.kind === 'skill') {
                            const skill =
                                option.skillOption;

                            console.log(
                                `[今晚守城] 小关${this.currentWave} 强化：${skill.professionName} -> ${skill.skill.name} Lv.${skill.nextLevel}`,
                            );
                        } else {
                            console.log(
                                `[今晚守城] 小关${this.currentWave} 全队属性：${option.stat.name} Lv.${option.nextLevel}`,
                            );
                        }

                        this.finishReward();
                    },
                );

        this.overlay =
            overlay;
    }

    /**
     * 三选一只从“当前上阵职业”中抽取技能。
     *
     * 权重：
     * - 主角职业 +2；
     * - 每名 AI 英雄职业 +1；
     * - 同职业自动叠加；
     * - 技能等级由 ProfessionSkillRunState 统一维护。
     */
    private getSkillRollSources():
        ProfessionSkillRollSource[] {
        const merged =
            new Map<
                string,
                ProfessionSkillRollSource
            >();

        const add = (
            professionId:
                Parameters<typeof getProfessionById>[0],
            weight: number,
            includesMainHero: boolean,
        ): void => {
            const profession =
                getProfessionById(
                    professionId,
                );

            const existing =
                merged.get(
                    professionId,
                );

            if (existing) {
                existing.weight += weight;
                existing.memberCount += 1;
                existing.includesMainHero =
                    existing.includesMainHero ||
                    includesMainHero;
                return;
            }

            merged.set(
                professionId,
                {
                    professionId,
                    professionName:
                        profession.name,
                    weight,
                    memberCount: 1,
                    includesMainHero,
                },
            );
        };

        const mainHero =
            HeroSelectionState.current;

        if (mainHero) {
            add(
                mainHero.professionId,
                2,
                true,
            );
        }

        for (
            const member
            of this.party.getMembers()
        ) {
            if (!member.catalogId) {
                continue;
            }

            const definition =
                getCharacterById(
                    member.catalogId,
                );

            if (!definition) {
                continue;
            }

            add(
                definition.professionId,
                1,
                false,
            );
        }

        return [...merged.values()];
    }

    private finishReward(): void {
        this.destroyOverlay();
        this.resumeBattle();

        const callback =
            this.rewardComplete;

        this.rewardComplete =
            null;

        callback?.();
    }

    private pauseBattle(): void {
        const enemy =
            this.node.getComponent(
                EnemyController,
            );

        const attack =
            this.node.getComponent(
                AutoAttackController,
            );

        const hero =
            this.node.getComponent(
                MainHeroController,
            );

        const joystick =
            this.node.getComponent(
                VirtualJoystick,
            );

        const companion =
            this.node.getComponent(
                CompanionBattleController,
            );

        const skillRuntime =
            this.node.getComponent(
                HeroSkillRuntime,
            );

        const statusEffect =
            this.node.getComponent(
                StatusEffectSystem,
            );

        this.enemyWasEnabled =
            !!enemy?.enabled;

        this.attackWasEnabled =
            !!attack?.enabled;

        this.heroWasEnabled =
            !!hero?.enabled;

        this.joystickWasEnabled =
            !!joystick?.enabled;

        this.companionWasEnabled =
            !!companion?.enabled;

        this.skillRuntimeWasEnabled =
            !!skillRuntime?.enabled;

        this.statusEffectWasEnabled =
            !!statusEffect?.enabled;

        if (enemy) {
            enemy.enabled = false;
        }

        if (attack) {
            attack.enabled = false;
        }

        if (hero) {
            hero.enabled = false;
        }

        if (joystick) {
            joystick.enabled = false;
        }

        if (companion) {
            companion.enabled = false;
        }

        if (skillRuntime) {
            skillRuntime.enabled = false;
        }

        if (statusEffect) {
            statusEffect.enabled = false;
        }
    }

    private resumeBattle(): void {
        const enemy =
            this.node.getComponent(
                EnemyController,
            );

        const attack =
            this.node.getComponent(
                AutoAttackController,
            );

        const hero =
            this.node.getComponent(
                MainHeroController,
            );

        const joystick =
            this.node.getComponent(
                VirtualJoystick,
            );

        const companion =
            this.node.getComponent(
                CompanionBattleController,
            );

        const skillRuntime =
            this.node.getComponent(
                HeroSkillRuntime,
            );

        const statusEffect =
            this.node.getComponent(
                StatusEffectSystem,
            );

        if (enemy) {
            enemy.enabled =
                this.enemyWasEnabled;
        }

        if (attack) {
            attack.enabled =
                this.attackWasEnabled;
        }

        if (hero) {
            hero.enabled =
                this.heroWasEnabled;
        }

        if (joystick) {
            joystick.enabled =
                this.joystickWasEnabled;
        }

        if (companion) {
            companion.enabled =
                this.companionWasEnabled;
        }

        if (skillRuntime) {
            skillRuntime.enabled =
                this.skillRuntimeWasEnabled;
        }

        if (statusEffect) {
            statusEffect.enabled =
                this.statusEffectWasEnabled;
        }
    }

    private destroyOverlay(): void {
        if (
            this.overlay &&
            this.overlay.isValid
        ) {
            this.overlay.destroy();
        }

        this.overlay = null;
    }


}
