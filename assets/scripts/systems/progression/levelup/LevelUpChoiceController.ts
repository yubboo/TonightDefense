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
    getCompanionById,
} from '../../character/data/CompanionCatalog';

import {
    PartyState,
} from '../../character/party/PartyState';

import {
    RecruitService,
} from '../recruitment/RecruitService';

import {
    AutoAttackController,
} from '../../battle/combat/AutoAttackController';

import {
    EnemyController,
} from '../../battle/enemy/EnemyController';

import {
    MainHeroController,
} from '../../character/player/MainHeroController';

import {
    VirtualJoystick,
} from '../../../ui/input/VirtualJoystick';

import {
    CompanionBattleController,
} from '../../character/companion/CompanionBattleController';

import {
    SkillTargetInfo,
    SkillUpgradeService,
} from '../../skill/runtime/SkillUpgradeService';

import {
    WaveRewardKind,
} from './WaveRewardSchedule';

import {
    PartyMemberType,
} from '../../../shared/GameEnums';

import {
    RecruitChoicePanel,
} from '../../../ui/panels/recruit/RecruitChoicePanel';

import {
    SkillChoicePanel,
} from '../../../ui/panels/skill/SkillChoicePanel';

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
     * SkillChoicePanel 只负责技能卡 UI。
     *
     * LevelUpChoiceController 负责：
     * - 生成三条候选强化
     * - 应用技能
     * - 结束奖励流程
     */
    private async openSkillChoice():
        Promise<void> {
        const targets =
            this.getSkillTargets();

        const options =
            SkillUpgradeService
                .rollThreeOptions(
                    targets,
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
                            SkillUpgradeService
                                .apply(
                                    option,
                                );

                        if (!success) {
                            selected = false;

                            console.warn(
                                `[今晚守城] 技能强化应用失败：${option.target.name} / ${option.skill.name}`,
                            );

                            return;
                        }

                        console.log(
                            `[今晚守城] 小关${this.currentWave} 强化：${option.target.name} -> ${option.skill.name}`,
                        );

                        this.finishReward();
                    },
                );

        this.overlay =
            overlay;
    }

    private getSkillTargets():
        SkillTargetInfo[] {
        const result:
            SkillTargetInfo[] = [];

        for (
            const member
            of this.party
                .getMembers()
        ) {
            if (
                member.type ===
                PartyMemberType.Human
            ) {
                const selected =
                    HeroSelectionState
                        .current;

                const profession =
                    selected
                        ? getProfessionById(
                            selected
                                .professionId,
                        )
                        : null;

                result.push(
                    {
                        id:
                            'main-hero',

                        name:
                            selected
                                ?.name ??
                            '主角',

                        kind:
                            'hero',

                        role:
                            profession
                                ? `${profession.name} · ${profession.roleLabel}`
                                : '主角',
                    },
                );

                continue;
            }

            if (
                !member.catalogId
            ) {
                continue;
            }

            const definition =
                getCompanionById(
                    member.catalogId,
                );

            result.push(
                {
                    id:
                        member
                            .catalogId,

                    name:
                        member.name,

                    kind:
                        'companion',

                    role:
                        definition
                            ?.role,
                },
            );
        }

        return result;
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
