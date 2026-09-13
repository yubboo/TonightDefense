import {
    _decorator,
    Component,
    Node,
} from 'cc';

import {
    MainHeroController,
} from '../../character/player/MainHeroController';

import {
    CompanionBattleController,
} from '../../character/companion/CompanionBattleController';

import {
    BattlePartyHUD,
    HeroSkillState,
} from '../../../../ui/hud/BattlePartyHUD';

import {
    getProfessionSkillModule,
    getSkillLevelTuning,
} from '../data/ProfessionSkillCatalog';

import {
    ProfessionSkillRunState,
} from './ProfessionSkillRunState';

import {
    SkillEffectResolver,
} from '../effect/SkillEffectResolver';

import {
    StatusEffectSystem,
} from '../effect/StatusEffectSystem';

import {
    BattleStatisticsService,
} from '../../../battle/statistics/BattleStatisticsService';

import {
    CombatEventBus,
    EnemyDamagedCombatEvent,
    EnemyDefeatedCombatEvent,
    HeroDamagedCombatEvent,
} from '../../../battle/combat/CombatEventBus';

import {
    EnemyStatusSystem,
} from '../../../battle/enemy/status/EnemyStatusSystem';

import {
    ProfessionId,
} from '../../profession/definition/ProfessionTypes';

import {
    HeroSkillActor,
} from './HeroSkillActor';

const { ccclass } = _decorator;

interface ActorSkillRuntime {
    actorId: string;
    node: Node;
    professionId: ProfessionId;
    cooldowns: number[];
    passiveTimer: number;
    passiveStacks: number;
    resonanceStacks: number;
    resonanceTimer: number;
    tankStackTimer: number;
}

/**
 * 英雄职业技能战斗 Runtime。
 *
 * 规则：
 * - 主角和 AI 英雄共用同一套职业技能逻辑；
 * - 1 被动 + 4 主动；
 * - 被动职业入场自动 Lv.1；主动技能 Lv.0 时锁定；
 * - 主动技能冷却结束且存在合法目标时自动释放；
 * - 同职业共享本局技能等级，但每个英雄独立计算冷却。
 */
@ccclass('HeroSkillRuntime')
export class HeroSkillRuntime extends Component {
    static instance:
        HeroSkillRuntime | null = null;

    private readonly actors =
        new Map<string, ActorSkillRuntime>();

    private rosterRefreshTimer = 0;
    private castTick = 0;
    private hudTimer = 0;

    private unsubscribeHeroDamaged:
        (() => void) | null = null;
    private unsubscribeEnemyDamaged:
        (() => void) | null = null;
    private unsubscribeEnemyDefeated:
        (() => void) | null = null;

    onLoad(): void {
        HeroSkillRuntime.instance = this;

        this.unsubscribeHeroDamaged =
            CombatEventBus.onHeroDamaged(
                (event) =>
                    this.onHeroDamaged(event),
            );
        this.unsubscribeEnemyDamaged =
            CombatEventBus.onEnemyDamaged(
                (event) =>
                    this.onEnemyDamaged(event),
            );
        this.unsubscribeEnemyDefeated =
            CombatEventBus.onEnemyDefeated(
                (event) =>
                    this.onEnemyDefeated(event),
            );
    }

    onDestroy(): void {
        this.unsubscribeHeroDamaged?.();
        this.unsubscribeEnemyDamaged?.();
        this.unsubscribeEnemyDefeated?.();
        this.unsubscribeHeroDamaged = null;
        this.unsubscribeEnemyDamaged = null;
        this.unsubscribeEnemyDefeated = null;

        this.actors.clear();

        if (
            HeroSkillRuntime.instance ===
            this
        ) {
            HeroSkillRuntime.instance = null;
        }
    }

    update(dt: number): void {
        this.rosterRefreshTimer -= dt;
        this.castTick -= dt;
        this.hudTimer -= dt;

        const battleActors =
            this.getBattleActors();

        if (
            this.rosterRefreshTimer <= 0
        ) {
            this.rosterRefreshTimer = 0.25;
            this.syncActorState(
                battleActors,
            );
        }

        for (const actor of battleActors) {
            const runtime =
                this.actors.get(
                    actor.actorId,
                );

            if (!runtime) {
                continue;
            }

            const cooldownRate =
                this.updatePassive(
                    actor,
                    battleActors,
                    runtime,
                    dt,
                );

            for (
                let i = 0;
                i < runtime.cooldowns.length;
                i += 1
            ) {
                runtime.cooldowns[i] =
                    Math.max(
                        0,
                        runtime.cooldowns[i] -
                        dt * cooldownRate,
                    );
            }
        }

        if (this.castTick <= 0) {
            this.castTick = 0.10;
            this.tryAutoCast(
                battleActors,
            );
        }

        if (this.hudTimer <= 0) {
            this.hudTimer = 0.10;
            this.emitMainHeroState();
        }
    }

    private getBattleActors():
        HeroSkillActor[] {
        const result:
            HeroSkillActor[] = [];

        const hero =
            MainHeroController.instance;

        if (
            hero?.targetNode &&
            hero.combatant &&
            hero.selectedCharacter &&
            hero.selectedProfession &&
            hero.isCombatReady
        ) {
            result.push({
                actorId: 'main-hero',
                controlMode: 'player',
                definition:
                    hero.selectedCharacter,
                profession:
                    hero.selectedProfession,
                node:
                    hero.targetNode,
                combatant:
                    hero.combatant,
            });
        }

        for (
            const companion
            of CompanionBattleController
                .instance
                ?.getBattleActors() ??
            []
        ) {
            if (
                !companion.isAlive ||
                companion.isReviving ||
                !companion.node.isValid
            ) {
                continue;
            }

            result.push({
                actorId:
                    companion.actorId,
                controlMode: 'ai',
                definition:
                    companion.definition,
                profession:
                    companion.profession,
                node:
                    companion.node,
                combatant:
                    companion.combatant,
            });
        }

        return result;
    }

    private syncActorState(
        battleActors:
            readonly HeroSkillActor[],
    ): void {
        const aliveIds =
            new Set<string>();

        for (const actor of battleActors) {
            aliveIds.add(
                actor.actorId,
            );

            ProfessionSkillRunState
                .ensureProfession(
                    actor.profession.id,
                );

            if (
                !this.actors.has(
                    actor.actorId,
                )
            ) {
                this.actors.set(
                    actor.actorId,
                    {
                        actorId:
                            actor.actorId,
                        node:
                            actor.node,
                        professionId:
                            actor.profession.id,
                        cooldowns: [
                            0.25,
                            0.45,
                            0.65,
                            0.85,
                        ],
                        passiveTimer: 0,
                        passiveStacks: 0,
                        resonanceStacks: 0,
                        resonanceTimer: 0,
                        tankStackTimer: 0,
                    },
                );
            } else {
                const existing =
                    this.actors.get(
                        actor.actorId,
                    );

                if (existing) {
                    existing.node = actor.node;
                    existing.professionId =
                        actor.profession.id;
                }
            }
        }

        for (
            const actorId
            of this.actors.keys()
        ) {
            if (
                !aliveIds.has(
                    actorId,
                )
            ) {
                this.actors.delete(
                    actorId,
                );
            }
        }
    }

    private tryAutoCast(
        battleActors:
            readonly HeroSkillActor[],
    ): void {
        for (const actor of battleActors) {
            const runtime =
                this.actors.get(
                    actor.actorId,
                );

            if (
                !runtime ||
                !actor.combatant.isAlive
            ) {
                continue;
            }

            const module =
                getProfessionSkillModule(
                    actor.profession.id,
                );

            for (
                let slot = 0;
                slot < 4;
                slot += 1
            ) {
                if (
                    runtime.cooldowns[slot] >
                    0
                ) {
                    continue;
                }

                const skill =
                    module.activeSkills[
                        slot
                    ];
                const level =
                    ProfessionSkillRunState
                        .getLevel(
                            actor.profession.id,
                            skill.id,
                        );

                if (level <= 0) {
                    continue;
                }

                const passive =
                    module.passive;
                const passiveLevel =
                    ProfessionSkillRunState
                        .getLevel(
                            actor.profession.id,
                            passive.id,
                        );
                const passiveTuning =
                    getSkillLevelTuning(
                        passive,
                        passiveLevel,
                    );

                const empowered =
                    passive.id ===
                        'mage_elemental_resonance' &&
                    runtime.resonanceStacks >=
                        3;

                const empoweredDamageBonus =
                    empowered
                        ? this.getTagNumber(
                            passiveTuning.specialTags,
                            'empower-damage:',
                            0.30,
                        )
                        : 0;
                const empoweredRadiusBonus =
                    empowered
                        ? this.getTagNumber(
                            passiveTuning.specialTags,
                            'empower-radius:',
                            0.20,
                        )
                        : 0;

                const result =
                    SkillEffectResolver.cast(
                        actor,
                        battleActors,
                        skill,
                        level,
                        empowered
                            ? {
                                damageMultiplier:
                                    1 +
                                    Math.max(
                                        0,
                                        empoweredDamageBonus,
                                    ),
                                radiusMultiplier:
                                    1 +
                                    Math.max(
                                        0,
                                        empoweredRadiusBonus,
                                    ),
                            }
                            : undefined,
                    );

                if (!result.success) {
                    continue;
                }

                if (
                    passive.id ===
                    'mage_elemental_resonance'
                ) {
                    runtime.resonanceStacks =
                        empowered
                            ? 0
                            : Math.min(
                                3,
                                runtime
                                    .resonanceStacks +
                                    1,
                            );
                    runtime.resonanceTimer =
                        empowered
                            ? 0
                            : Math.max(
                                1,
                                passiveTuning.duration ??
                                8,
                            );
                }

                const tuning =
                    getSkillLevelTuning(
                        skill,
                        level,
                    );
                const baseCooldown =
                    tuning.cooldown ??
                    skill.baseCooldown;
                const empoweredRefund =
                    empowered
                        ? Math.max(
                            0,
                            Math.min(
                                0.8,
                                passiveTuning
                                    .cooldownRefundRatio ??
                                0,
                            ),
                        )
                        : 0;
                const killRefund =
                    result.defeatedCount &&
                    result.defeatedCount > 0 &&
                    tuning.specialTags
                        ?.includes('kill-refund')
                        ? Math.max(
                            0,
                            Math.min(
                                0.8,
                                tuning.cooldownRefundRatio ?? 0,
                            ),
                        )
                        : 0;
                const totalRefund =
                    1 -
                    (1 - empoweredRefund) *
                    (1 - killRefund);

                runtime.cooldowns[slot] =
                    Math.max(
                        0.25,
                        baseCooldown *
                        (1 - totalRefund),
                    );

                BattleStatisticsService
                    .instance
                    ?.recordSkillCast();
            }
        }
    }

    private updatePassive(
        actor: HeroSkillActor,
        allies: readonly HeroSkillActor[],
        runtime: ActorSkillRuntime,
        dt: number,
    ): number {
        const module =
            getProfessionSkillModule(
                actor.profession.id,
            );
        const passive =
            module.passive;
        const level =
            ProfessionSkillRunState
                .getLevel(
                    actor.profession.id,
                    passive.id,
                );
        const tuning =
            getSkillLevelTuning(
                passive,
                level,
            );

        if (
            passive.id ===
            'warrior_battle_fury'
        ) {
            runtime.passiveTimer += dt;

            const interval =
                Math.max(
                    1,
                    tuning.duration ?? 5,
                );
            const stackTag =
                tuning.specialTags
                    ?.find(
                        (tag) =>
                            tag.startsWith(
                                'fury-stack:',
                            ),
                    );
            const maxStacks =
                stackTag
                    ? Number(
                        stackTag.split(':')[1],
                    )
                    : 5;

            if (
                runtime.passiveTimer >=
                    interval &&
                runtime.passiveStacks <
                    maxStacks
            ) {
                runtime.passiveTimer -=
                    interval;
                runtime.passiveStacks += 1;
            }

            actor.combatant.setModifier(
                'passive:warrior-battle-fury',
                {
                    attackMultiplier:
                        1 +
                        (tuning.attackBonus ?? 0) *
                        runtime.passiveStacks,
                },
            );

            const fullCdrTag =
                tuning.specialTags
                    ?.find(
                        (tag) =>
                            tag.startsWith(
                                'full-fury-cdr:',
                            ),
                    );
            const fullCdrBonus =
                fullCdrTag
                    ? Math.max(
                        0,
                        Number(
                            fullCdrTag.split(':')[1],
                        ) || 0,
                    )
                    : 0;
            const fullCdr =
                runtime.passiveStacks >=
                    maxStacks
                    ? 1 + fullCdrBonus
                    : 1;

            return fullCdr;
        }

        if (
            passive.id ===
            'support_guardian_aura'
        ) {
            const healTag =
                tuning.specialTags
                    ?.find(
                        (tag) =>
                            tag.startsWith(
                                'healing-received:',
                            ),
                    );
            const healBonus =
                healTag
                    ? Number(
                        healTag.split(':')[1],
                    )
                    : 0;

            for (const ally of allies) {
                StatusEffectSystem.instance
                    ?.applyHeroModifier(
                        ally.combatant,
                        `passive:guardian-aura:${actor.actorId}`,
                        {
                            damageReduction:
                                tuning.damageReduction ??
                                0,
                            healingReceivedMultiplier:
                                1 +
                                Math.max(
                                    0,
                                    healBonus,
                                ),
                        },
                        0.35,
                    );
            }
        }

        if (
            passive.id ===
            'tank_iron_wall'
        ) {
            const hitStackTag =
                tuning.specialTags
                    ?.find(
                        (tag) =>
                            tag.startsWith(
                                'hit-stack:',
                            ),
                    );
            const maxStacks =
                hitStackTag
                    ? Math.max(
                        1,
                        Number(
                            hitStackTag.split(':')[1],
                        ) || 5,
                    )
                    : 5;
            runtime.tankStackTimer =
                Math.max(
                    0,
                    runtime.tankStackTimer - dt,
                );

            if (
                runtime.tankStackTimer <= 0
            ) {
                runtime.passiveStacks = 0;
            }

            actor.combatant.setModifier(
                'passive:tank-iron-wall',
                {
                    damageReduction:
                        (tuning.damageReduction ??
                            0.02) *
                        runtime.passiveStacks,
                },
            );

            if (
                runtime.passiveStacks >=
                    maxStacks &&
                tuning.shieldMaxHpRatio &&
                tuning.specialTags
                    ?.includes(
                        'full-stack-shield',
                    )
            ) {
                runtime.passiveTimer += dt;

                if (runtime.passiveTimer >= 6) {
                    runtime.passiveTimer = 0;
                    actor.combatant.addShield(
                        actor.combatant.maxHp *
                        tuning.shieldMaxHpRatio,
                    );
                }
            } else {
                runtime.passiveTimer = 0;
            }
        }

        if (
            passive.id ===
            'mage_elemental_resonance'
        ) {
            if (
                runtime.resonanceStacks > 0
            ) {
                runtime.resonanceTimer =
                    Math.max(
                        0,
                        runtime.resonanceTimer - dt,
                    );

                if (
                    runtime.resonanceTimer <= 0
                ) {
                    runtime.resonanceStacks = 0;
                }
            }
        }


        if (
            passive.id.endsWith(
                '_passive',
            ) &&
            tuning.attackBonus
        ) {
            actor.combatant.setModifier(
                `passive:${passive.id}`,
                {
                    attackMultiplier:
                        1 +
                        tuning.attackBonus,
                    damageReduction:
                        tuning.damageReduction ??
                        0,
                },
            );
        }

        return 1;
    }

    private onHeroDamaged(
        event: HeroDamagedCombatEvent,
    ): void {
        if (event.actualDamage <= 0) {
            return;
        }

        for (const runtime of this.actors.values()) {
            if (
                runtime.node !==
                event.targetNode
            ) {
                continue;
            }

            const module =
                getProfessionSkillModule(
                    runtime.professionId,
                );

            if (
                module.passive.id !==
                'tank_iron_wall'
            ) {
                return;
            }

            const level =
                ProfessionSkillRunState
                    .getLevel(
                        runtime.professionId,
                        module.passive.id,
                    );
            const tuning =
                getSkillLevelTuning(
                    module.passive,
                    level,
                );
            const maxStacks =
                Math.max(
                    1,
                    this.getTagNumber(
                        tuning.specialTags,
                        'hit-stack:',
                        5,
                    ),
                );

            runtime.passiveStacks =
                Math.min(
                    maxStacks,
                    runtime.passiveStacks + 1,
                );
            runtime.tankStackTimer =
                Math.max(
                    0.5,
                    tuning.duration ?? 4,
                );
            return;
        }
    }

    private onEnemyDamaged(
        event: EnemyDamagedCombatEvent,
    ): void {
        if (
            event.killed ||
            event.source?.professionId !==
                'ranger'
        ) {
            return;
        }

        ProfessionSkillRunState
            .ensureProfession('ranger');

        const module =
            getProfessionSkillModule(
                'ranger',
            );
        const passive =
            module.passive;

        if (
            passive.id !==
            'ranger_hunters_mark'
        ) {
            return;
        }

        const level =
            ProfessionSkillRunState
                .getLevel(
                    'ranger',
                    passive.id,
                );
        const tuning =
            getSkillLevelTuning(
                passive,
                level,
            );

        EnemyStatusSystem.applyHunterMark(
            event.enemyId,
            tuning.duration ?? 5,
            this.getTagNumber(
                tuning.specialTags,
                'hunter-mark:',
                0.05,
            ),
            this.getTagNumber(
                tuning.specialTags,
                'mark-kill-cdr:',
                0,
            ),
            this.getTagNumber(
                tuning.specialTags,
                'mark-crit:',
                0,
            ),
        );
    }

    private onEnemyDefeated(
        event: EnemyDefeatedCombatEvent,
    ): void {
        if (
            event.source?.professionId !==
                'ranger' ||
            !event.source.actorId
        ) {
            return;
        }

        const mark =
            EnemyStatusSystem
                .getHunterMark(
                    event.enemyId,
                );

        if (
            !mark ||
            mark.killCooldownReduction <= 0
        ) {
            return;
        }

        const runtime =
            this.actors.get(
                event.source.actorId,
            );

        if (!runtime) {
            return;
        }

        for (
            let i = 0;
            i < runtime.cooldowns.length;
            i += 1
        ) {
            runtime.cooldowns[i] =
                Math.max(
                    0,
                    runtime.cooldowns[i] -
                    mark.killCooldownReduction,
                );
        }
    }

    private getTagNumber(
        tags: readonly string[] | undefined,
        prefix: string,
        fallback: number,
    ): number {
        const tag =
            tags?.find(
                (entry) =>
                    entry.startsWith(prefix),
            );

        if (!tag) {
            return fallback;
        }

        const value =
            Number(
                tag.slice(prefix.length),
            );

        return Number.isFinite(value)
            ? value
            : fallback;
    }

    private emitMainHeroState(): void {
        const hero =
            MainHeroController.instance;

        if (
            !hero?.selectedProfession
        ) {
            return;
        }

        const runtime =
            this.actors.get(
                'main-hero',
            );

        if (!runtime) {
            return;
        }

        const module =
            getProfessionSkillModule(
                hero.selectedProfession.id,
            );

        const levels =
            module.activeSkills.map(
                (skill) =>
                    ProfessionSkillRunState
                        .getLevel(
                            hero.selectedProfession!.id,
                            skill.id,
                        ),
            );

        const totals =
            module.activeSkills.map(
                (skill, index) => {
                    const level =
                        levels[index];

                    if (level <= 0) {
                        return skill.baseCooldown;
                    }

                    return (
                        getSkillLevelTuning(
                            skill,
                            level,
                        ).cooldown ??
                        skill.baseCooldown
                    );
                },
            );

        this.node.emit(
            BattlePartyHUD
                .SKILL_STATE_EVENT,
            {
                cooldownRemaining:
                    [...runtime.cooldowns],
                cooldownTotal:
                    totals,
                levels,
                unlocked:
                    levels.map(
                        (level) =>
                            level > 0,
                    ),
                names:
                    module.activeSkills
                        .map(
                            (skill) =>
                                skill.name,
                        ),
                passiveName:
                    module.passive.name,
                passiveLevel:
                    ProfessionSkillRunState
                        .getLevel(
                            hero.selectedProfession.id,
                            module.passive.id,
                        ),
            } as HeroSkillState,
        );
    }
}
