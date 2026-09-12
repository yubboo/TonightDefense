import {
    _decorator,
    Component,
} from 'cc';

import {
    MainHeroController,
} from '../../character/player/MainHeroController';

import {
    BattlePartyHUD,
    HeroSkillIntent,
    HeroSkillState,
} from '../../../ui/hud/BattlePartyHUD';

import {
    getActiveSkillLoadout,
} from './ActiveSkillCatalog';

import {
    SkillEffectResolver,
} from './SkillEffectResolver';

import {
    BattleStatisticsService,
} from '../../battle/statistics/BattleStatisticsService';

const { ccclass } = _decorator;

/** 主动技能冷却、能量与结算的唯一状态拥有者。 */
@ccclass('ActiveSkillRuntime')
export class ActiveSkillRuntime extends Component {
    private readonly cooldowns =
        [0, 0, 0, 0];

    private energy = 100;
    private readonly maxEnergy = 100;
    private stateTimer = 0;

    onLoad(): void {
        this.node.on(
            BattlePartyHUD.SKILL_INTENT_EVENT,
            this.onSkillIntent,
            this,
        );
    }

    onDestroy(): void {
        this.node.off(
            BattlePartyHUD.SKILL_INTENT_EVENT,
            this.onSkillIntent,
            this,
        );
    }

    update(dt: number): void {
        for (let i = 0; i < this.cooldowns.length; i += 1) {
            this.cooldowns[i] =
                Math.max(0, this.cooldowns[i] - dt);
        }

        this.energy =
            Math.min(
                this.maxEnergy,
                this.energy + dt * 4.5,
            );

        this.stateTimer -= dt;

        if (this.stateTimer <= 0) {
            this.stateTimer = 0.1;
            this.emitState();
        }
    }

    private onSkillIntent(
        intent: HeroSkillIntent,
    ): void {
        const slot =
            Math.max(
                0,
                Math.min(3, Math.floor(intent.slotIndex)),
            );

        const hero = MainHeroController.instance;

        if (
            !hero?.selectedProfession ||
            !hero.combatant?.isAlive ||
            this.cooldowns[slot] > 0
        ) {
            return;
        }

        const skill =
            getActiveSkillLoadout(
                hero.selectedProfession.id,
            ).skills[slot];

        if (this.energy < skill.energyCost) {
            return;
        }

        if (!SkillEffectResolver.cast(hero, skill)) {
            return;
        }

        this.energy -= skill.energyCost;
        this.cooldowns[slot] = skill.cooldown;
        BattleStatisticsService.instance
            ?.recordSkillCast();
        this.emitState();
    }

    private emitState(): void {
        const professionId =
            MainHeroController.instance
                ?.selectedProfession
                ?.id ??
            'flame_caster';

        const loadout =
            getActiveSkillLoadout(professionId);

        this.node.emit(
            BattlePartyHUD.SKILL_STATE_EVENT,
            {
                cooldownRemaining: [...this.cooldowns],
                energy: this.energy,
                maxEnergy: this.maxEnergy,
                names: loadout.skills.map((skill) => skill.name),
            } as HeroSkillState,
        );
    }
}
