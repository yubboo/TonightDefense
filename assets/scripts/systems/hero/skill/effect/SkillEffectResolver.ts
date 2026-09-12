import {
    Color,
    Graphics,
    Node,
    tween,
    UITransform,
    Vec3,
} from 'cc';

import {
    EnemyController,
    EnemyDamageContext,
    EnemyTarget,
} from '../../../battle/enemy/EnemyController';

import {
    EnemyStatusSystem,
} from '../../../battle/enemy/status/EnemyStatusSystem';

import {
    BattleEffectPool,
} from '../../../battle/runtime/BattleEffectPool';

import {
    ProfessionSkillDefinition,
} from '../data/ProfessionSkillTypes';

import {
    getSkillLevelTuning,
} from '../data/ProfessionSkillCatalog';

import {
    HeroSkillActor,
} from '../runtime/HeroSkillActor';

import {
    SkillTargeting,
} from '../targeting/SkillTargeting';

import {
    StatusEffectSystem,
} from './StatusEffectSystem';

export interface SkillCastResult {
    success: boolean;
    affectedCount: number;
    defeatedCount?: number;
}

export interface SkillCastModifiers {
    damageMultiplier?: number;
    radiusMultiplier?: number;
}

/**
 * 职业主动技能统一结算入口。
 *
 * Runtime 只管“何时释放 / 冷却”，这里负责“对谁产生什么效果”。
 * 复杂职业逻辑以后继续扩行为或状态系统，不允许把伤害结算写回 HUD。
 */
export class SkillEffectResolver {
    static cast(
        actor: HeroSkillActor,
        allies: readonly HeroSkillActor[],
        skill: ProfessionSkillDefinition,
        level: number,
        modifiers?: SkillCastModifiers,
    ): SkillCastResult {
        if (
            skill.kind !== 'active' ||
            level <= 0 ||
            !actor.node.isValid ||
            !actor.combatant.isAlive
        ) {
            return {
                success: false,
                affectedCount: 0,
            };
        }

        const baseTuning =
            getSkillLevelTuning(
                skill,
                level,
            );
        const damageMultiplier =
            Math.max(
                0,
                modifiers?.damageMultiplier ?? 1,
            );
        const radiusMultiplier =
            Math.max(
                0.1,
                modifiers?.radiusMultiplier ?? 1,
            );
        const tuning = {
            ...baseTuning,
            damageRatio:
                baseTuning.damageRatio === undefined
                    ? undefined
                    : baseTuning.damageRatio *
                        damageMultiplier,
            radius:
                baseTuning.radius === undefined
                    ? undefined
                    : baseTuning.radius *
                        radiusMultiplier,
        };

        switch (skill.behavior) {
            case 'self_shield': {
                const ratio =
                    tuning.shieldMaxHpRatio ??
                    0.16;

                actor.combatant.addShield(
                    actor.combatant.maxHp *
                    ratio,
                );

                this.showPulse(
                    actor.node,
                    88,
                    new Color(
                        255,
                        176,
                        72,
                        190,
                    ),
                );

                return {
                    success: true,
                    affectedCount: 1,
                };
            }

            case 'single_heal':
                return this.castSingleHeal(
                    actor,
                    allies,
                    skill.id,
                    tuning,
                );

            case 'single_shield':
                return this.castSingleShield(
                    actor,
                    allies,
                    skill.id,
                    tuning,
                );

            case 'team_shield':
                return this.castTeamShield(
                    actor,
                    allies,
                    skill.id,
                    tuning,
                );

            case 'team_buff':
                return this.castTeamBuff(
                    actor,
                    allies,
                    skill.id,
                    tuning,
                );

            case 'sanctuary':
                return this.castSanctuary(
                    actor,
                    allies,
                    skill.id,
                    tuning,
                );

            case 'chain_damage':
                return this.castChainDamage(
                    actor,
                    skill,
                    tuning,
                );

            case 'line_damage': {
                const targets =
                    SkillTargeting.frontLine(
                        actor.node.position,
                        tuning.range ?? 420,
                        tuning.radius ?? 70,
                    );

                return this.damageTargets(
                    actor,
                    targets,
                    tuning,
                    1,
                    skill,
                );
            }

            case 'cone_damage': {
                const targets =
                    SkillTargeting.frontCone(
                        actor.node.position,
                        tuning.range ?? 230,
                    );

                return this.damageTargets(
                    actor,
                    targets,
                    tuning,
                    1,
                    skill,
                );
            }

            case 'multi_target_damage': {
                const targets =
                    SkillTargeting.frontCone(
                        actor.node.position,
                        tuning.range ?? 430,
                        58,
                    );

                const maxTargets =
                    Math.max(
                        1,
                        tuning.projectileCount ??
                        5,
                    );

                const orderedTargets =
                    tuning.specialTags
                        ?.includes('prefer-mark')
                        ? [...targets].sort(
                            (left, right) =>
                                Number(
                                    EnemyStatusSystem
                                        .isHunterMarked(
                                            right.id,
                                        ),
                                ) -
                                Number(
                                    EnemyStatusSystem
                                        .isHunterMarked(
                                            left.id,
                                        ),
                                ),
                        )
                        : targets;

                return this.damageTargets(
                    actor,
                    orderedTargets.slice(
                        0,
                        maxTargets,
                    ),
                    tuning,
                    1,
                    skill,
                );
            }

            case 'area_damage': {
                const targets =
                    skill.targetMode ===
                        'DENSEST_ENEMY_CLUSTER'
                        ? SkillTargeting
                            .densestEnemyCluster(
                                actor.node.position,
                                tuning.range ?? 520,
                                tuning.radius ?? 210,
                            )
                        : SkillTargeting
                            .enemiesInRadius(
                                actor.node.position,
                                tuning.radius ?? 210,
                            );

                return this.damageTargets(
                    actor,
                    targets,
                    tuning,
                    1,
                    skill,
                );
            }

            case 'multi_hit': {
                const target =
                    SkillTargeting.highestHpEnemy(
                        actor.node.position,
                        tuning.range ?? 380,
                    );

                return target
                    ? this.damageTargets(
                        actor,
                        [target],
                        tuning,
                        1,
                        skill,
                    )
                    : {
                        success: false,
                        affectedCount: 0,
                    };
            }

            case 'single_damage':
            default: {
                const target =
                    skill.targetMode ===
                        'HIGHEST_HP_ENEMY'
                        ? SkillTargeting
                            .highestHpEnemy(
                                actor.node.position,
                                tuning.range ?? 480,
                            )
                        : SkillTargeting
                            .nearestEnemy(
                                actor.node.position,
                                tuning.range ?? 480,
                            );

                if (!target) {
                    return {
                        success: false,
                        affectedCount: 0,
                    };
                }

                const result =
                    this.damageTargets(
                        actor,
                        [target],
                        tuning,
                        1,
                        skill,
                    );

                if (
                    result.success &&
                    tuning.radius &&
                    tuning.radius > 0
                ) {
                    const splash =
                        SkillTargeting
                            .enemiesInRadius(
                                target.node.position,
                                tuning.radius,
                            )
                            .filter(
                                (entry) =>
                                    entry.id !==
                                    target.id,
                            );

                    if (
                        splash.length > 0
                    ) {
                        this.damageTargets(
                            actor,
                            splash,
                            {
                                ...tuning,
                                damageRatio:
                                    (tuning.damageRatio ?? 1) *
                                    0.55,
                                hitCount: 1,
                            },
                            1,
                            skill,
                        );
                    }
                }

                return result;
            }
        }
    }

    private static castSingleHeal(
        actor: HeroSkillActor,
        allies: readonly HeroSkillActor[],
        skillId: string,
        tuning: ReturnType<typeof getSkillLevelTuning>,
    ): SkillCastResult {
        const target =
            SkillTargeting
                .lowestHpAlly(
                    allies,
                );

        if (!target) {
            return {
                success: false,
                affectedCount: 0,
            };
        }

        const ratio =
            tuning.healMaxHpRatio ??
            0.12;
        const healAmount =
            target.combatant.maxHp *
            ratio;
        const missingHp =
            Math.max(
                0,
                target.combatant.maxHp -
                target.combatant.currentHp,
            );
        const overhealTag =
            tuning.specialTags
                ?.find(
                    (tag) =>
                        tag.startsWith(
                            'overheal-shield:',
                        ),
                );
        const overhealShieldRatio =
            overhealTag
                ? Math.max(
                    0,
                    Number(
                        overhealTag.split(':')[1],
                    ) || 0,
                )
                : 0;

        if (
            missingHp <= 0 &&
            overhealShieldRatio <= 0
        ) {
            return {
                success: false,
                affectedCount: 0,
            };
        }

        if (missingHp > 0) {
            target.combatant.heal(
                healAmount,
            );
        } else if (
            overhealShieldRatio > 0
        ) {
            target.combatant.addShield(
                healAmount *
                overhealShieldRatio,
            );
        }

        this.showPulse(
            target.node,
            72,
            new Color(
                111,
                237,
                146,
                185,
            ),
        );

        if (
            tuning.secondaryAllyRatio &&
            tuning.secondaryAllyRatio > 0
        ) {
            const second =
                allies
                    .filter(
                        (ally) =>
                            ally !== target &&
                            ally.combatant.isAlive,
                    )
                    .sort(
                        (a, b) =>
                            a.combatant.currentHp /
                                a.combatant.maxHp -
                            b.combatant.currentHp /
                                b.combatant.maxHp,
                    )[0];

            if (second) {
                second.combatant.heal(
                    second.combatant.maxHp *
                    ratio *
                    tuning.secondaryAllyRatio,
                );
            }

            return {
                success: true,
                affectedCount:
                    second ? 2 : 1,
            };
        }

        return {
            success: true,
            affectedCount: 1,
        };
    }

    private static castSingleShield(
        actor: HeroSkillActor,
        allies: readonly HeroSkillActor[],
        skillId: string,
        tuning: ReturnType<typeof getSkillLevelTuning>,
    ): SkillCastResult {
        const target =
            SkillTargeting
                .lowestHpAlly(
                    allies,
                );

        if (!target) {
            return {
                success: false,
                affectedCount: 0,
            };
        }

        const ratio =
            tuning.shieldMaxHpRatio ??
            0.12;

        target.combatant.addShield(
            target.combatant.maxHp *
            ratio,
        );

        this.applyTimedModifier(
            target,
            `${skillId}:${actor.actorId}`,
            tuning,
        );

        if (
            tuning.secondaryAllyRatio &&
            tuning.secondaryAllyRatio > 0
        ) {
            const second =
                allies.find(
                    (ally) =>
                        ally !== target &&
                        ally.combatant.isAlive,
                );

            second?.combatant.addShield(
                second.combatant.maxHp *
                ratio *
                tuning.secondaryAllyRatio,
            );
        }

        this.showPulse(
            target.node,
            76,
            new Color(
                102,
                177,
                255,
                190,
            ),
        );

        return {
            success: true,
            affectedCount: 1,
        };
    }

    private static castTeamShield(
        actor: HeroSkillActor,
        allies: readonly HeroSkillActor[],
        skillId: string,
        tuning: ReturnType<typeof getSkillLevelTuning>,
    ): SkillCastResult {
        const selfRatio =
            tuning.shieldMaxHpRatio ??
            0.20;
        const allyRatio =
            selfRatio *
            (tuning.secondaryAllyRatio ?? 0.40);

        let count = 0;

        for (const ally of allies) {
            if (!ally.combatant.isAlive) {
                continue;
            }

            const ratio =
                ally.actorId ===
                    actor.actorId
                    ? selfRatio
                    : allyRatio;

            ally.combatant.addShield(
                ally.combatant.maxHp *
                ratio,
            );

            this.applyTimedModifier(
                ally,
                `${skillId}:${actor.actorId}`,
                tuning,
            );

            count += 1;
        }

        if (count > 0) {
            this.showPulse(
                actor.node,
                115,
                new Color(
                    102,
                    177,
                    255,
                    175,
                ),
            );
        }

        return {
            success: count > 0,
            affectedCount: count,
        };
    }

    private static castTeamBuff(
        actor: HeroSkillActor,
        allies: readonly HeroSkillActor[],
        skillId: string,
        tuning: ReturnType<typeof getSkillLevelTuning>,
    ): SkillCastResult {
        let count = 0;

        for (const ally of allies) {
            if (!ally.combatant.isAlive) {
                continue;
            }

            this.applyTimedModifier(
                ally,
                `${skillId}:${actor.actorId}`,
                tuning,
            );

            count += 1;
        }

        if (count > 0) {
            this.showPulse(
                actor.node,
                105,
                new Color(
                    255,
                    210,
                    92,
                    178,
                ),
            );
        }

        return {
            success: count > 0,
            affectedCount: count,
        };
    }

    private static castSanctuary(
        actor: HeroSkillActor,
        allies: readonly HeroSkillActor[],
        skillId: string,
        tuning: ReturnType<typeof getSkillLevelTuning>,
    ): SkillCastResult {
        const center =
            SkillTargeting
                .teamCenter(
                    allies,
                );

        if (!center) {
            return {
                success: false,
                affectedCount: 0,
            };
        }

        const radius =
            tuning.radius ??
            280;
        const duration =
            Math.max(
                1,
                tuning.duration ?? 4,
            );

        let count = 0;

        for (const ally of allies) {
            if (!ally.combatant.isAlive) {
                continue;
            }

            const dx =
                ally.node.position.x -
                center.x;
            const dy =
                ally.node.position.y -
                center.y;

            if (
                dx * dx + dy * dy >
                radius * radius
            ) {
                continue;
            }

            ally.combatant.heal(
                ally.combatant.maxHp *
                (tuning.healMaxHpRatio ?? 0.03) *
                duration,
            );

            this.applyTimedModifier(
                ally,
                `${skillId}:${actor.actorId}`,
                tuning,
            );

            count += 1;
        }

        if (count > 0) {
            this.showPulseAt(
                actor.node.parent,
                center,
                Math.min(
                    radius,
                    260,
                ),
                new Color(
                    112,
                    235,
                    149,
                    160,
                ),
            );
        }

        return {
            success: count > 0,
            affectedCount: count,
        };
    }

    private static castChainDamage(
        actor: HeroSkillActor,
        skill: ProfessionSkillDefinition,
        tuning: ReturnType<typeof getSkillLevelTuning>,
    ): SkillCastResult {
        const first =
            SkillTargeting
                .nearestEnemy(
                    actor.node.position,
                    tuning.range ?? 480,
                );

        if (!first) {
            return {
                success: false,
                affectedCount: 0,
            };
        }

        const controller =
            EnemyController.instance;

        if (!controller) {
            return {
                success: false,
                affectedCount: 0,
            };
        }

        const available =
            controller.getAliveEnemies();
        const selected:
            EnemyTarget[] = [first];

        while (
            selected.length <
                Math.max(
                    1,
                    tuning.chainCount ?? 5,
                ) &&
            selected.length <
                available.length
        ) {
            const last =
                selected[
                    selected.length - 1
                ];

            let next:
                EnemyTarget | null = null;
            let bestDistance =
                Number.POSITIVE_INFINITY;

            for (const candidate of available) {
                if (
                    selected.some(
                        (item) =>
                            item.id ===
                            candidate.id,
                    )
                ) {
                    continue;
                }

                const dx =
                    candidate.node.position.x -
                    last.node.position.x;
                const dy =
                    candidate.node.position.y -
                    last.node.position.y;
                const distance =
                    dx * dx + dy * dy;

                if (
                    distance <
                    bestDistance
                ) {
                    bestDistance = distance;
                    next = candidate;
                }
            }

            if (!next) {
                break;
            }

            selected.push(next);
        }

        const falloff =
            Math.max(
                0,
                Math.min(
                    0.9,
                    tuning.chainFalloff ?? 0.15,
                ),
            );
        const context =
            this.createDamageContext(
                actor,
                skill,
                tuning,
            );
        let defeatedCount = 0;

        selected.forEach(
            (target, index) => {
                const ratio =
                    (tuning.damageRatio ?? 1) *
                    Math.pow(
                        1 - falloff,
                        index,
                    );

                const result =
                    controller.takeDamageToEnemy(
                        target.node,
                        actor.combatant.attackPower *
                        ratio,
                        context,
                    );

                if (result?.killed) {
                    defeatedCount += 1;
                } else {
                    this.applyEnemyStatuses(
                        actor,
                        target,
                        skill,
                        tuning,
                    );
                }

                this.showPulse(
                    target.node,
                    44,
                    new Color(
                        121,
                        185,
                        255,
                        195,
                    ),
                );
            },
        );

        return {
            success: selected.length > 0,
            affectedCount: selected.length,
            defeatedCount,
        };
    }

    private static damageTargets(
        actor: HeroSkillActor,
        targets: readonly EnemyTarget[],
        tuning: ReturnType<typeof getSkillLevelTuning>,
        hitMultiplier: number,
        skill: ProfessionSkillDefinition,
    ): SkillCastResult {
        const controller =
            EnemyController.instance;

        if (
            !controller ||
            targets.length <= 0
        ) {
            return {
                success: false,
                affectedCount: 0,
            };
        }

        const hitCount =
            Math.max(
                1,
                tuning.hitCount ?? 1,
            );
        const baseRatio =
            Math.max(
                0,
                tuning.damageRatio ?? 1,
            );
        const falloffTag =
            tuning.specialTags
                ?.find(
                    (tag) =>
                        tag.startsWith(
                            'pierce-falloff:',
                        ),
                );
        const falloff =
            falloffTag
                ? Math.max(
                    0,
                    Math.min(
                        0.9,
                        Number(
                            falloffTag.split(':')[1],
                        ) || 0,
                    ),
                )
                : 0;
        const orderedTargets =
            falloff > 0
                ? [...targets].sort(
                    (left, right) => {
                        const ldx =
                            left.node.position.x -
                            actor.node.position.x;
                        const ldy =
                            left.node.position.y -
                            actor.node.position.y;
                        const rdx =
                            right.node.position.x -
                            actor.node.position.x;
                        const rdy =
                            right.node.position.y -
                            actor.node.position.y;
                        return (
                            ldx * ldx + ldy * ldy -
                            (rdx * rdx + rdy * rdy)
                        );
                    },
                )
                : targets;
        const context =
            this.createDamageContext(
                actor,
                skill,
                tuning,
            );
        const burnTargets: Node[] = [];
        let defeatedCount = 0;

        orderedTargets.forEach(
            (target, index) => {
                let bonus = 1;

                if (
                    tuning.eliteBossDamageBonus &&
                    target.rank !== 'normal'
                ) {
                    bonus +=
                        tuning.eliteBossDamageBonus;
                }

                const pierceMultiplier =
                    falloff > 0
                        ? Math.pow(
                            1 - falloff,
                            index,
                        )
                        : 1;
                const result =
                    controller.takeDamageToEnemy(
                        target.node,
                        actor.combatant.attackPower *
                        baseRatio *
                        hitCount *
                        hitMultiplier *
                        bonus *
                        pierceMultiplier,
                        context,
                    );

                if (result?.killed) {
                    defeatedCount += 1;
                } else {
                    this.applyEnemyStatuses(
                        actor,
                        target,
                        skill,
                        tuning,
                    );

                    if (target.node.isValid) {
                        burnTargets.push(
                            target.node,
                        );
                    }

                    if (
                        tuning.knockback &&
                        tuning.knockback > 0
                    ) {
                        this.applyKnockback(
                            actor.node,
                            target.node,
                            tuning.knockback,
                        );
                    }
                }
            },
        );

        if (
            burnTargets.length > 0 &&
            tuning.burnDuration &&
            tuning.burnDpsRatio
        ) {
            StatusEffectSystem.instance
                ?.applyBurn(
                    burnTargets,
                    tuning.burnDuration,
                    actor.combatant.attackPower *
                    tuning.burnDpsRatio,
                    {
                        kind: 'hero-dot',
                        actorId: actor.actorId,
                        professionId:
                            actor.profession.id,
                        skillId: skill.id,
                    },
                );
        }

        const pulseTarget =
            targets[0]?.node ??
            actor.node;

        this.showPulse(
            pulseTarget,
            Math.min(
                120,
                Math.max(
                    48,
                    tuning.radius ?? 72,
                ),
            ),
            new Color(
                255,
                103,
                58,
                188,
            ),
        );

        return {
            success: true,
            affectedCount: targets.length,
            defeatedCount,
        };
    }

    private static createDamageContext(
        actor: HeroSkillActor,
        skill: ProfessionSkillDefinition,
        tuning: ReturnType<typeof getSkillLevelTuning>,
    ): EnemyDamageContext {
        const critChance =
            this.getTagNumber(
                tuning.specialTags,
                'skill-crit:',
            );
        const markedTargetBonus =
            this.getTagNumber(
                tuning.specialTags,
                'mark-bonus:',
            );

        return {
            kind: 'hero-skill',
            actorId: actor.actorId,
            professionId:
                actor.profession.id,
            skillId: skill.id,
            defenseIgnoreRatio:
                tuning.defenseIgnoreRatio ?? 0,
            critChance,
            critMultiplier: 1.5,
            markedTargetBonus,
        };
    }

    private static applyEnemyStatuses(
        actor: HeroSkillActor,
        target: EnemyTarget,
        skill: ProfessionSkillDefinition,
        tuning: ReturnType<typeof getSkillLevelTuning>,
    ): void {
        if (!target.node.isValid) {
            return;
        }

        const tags =
            tuning.specialTags ?? [];
        const isTaunt =
            tags.includes('taunt');
        const duration =
            Math.max(
                0,
                tuning.duration ?? 0,
            );

        if (isTaunt) {
            EnemyStatusSystem.applyTaunt(
                target.id,
                target.rank,
                actor.actorId,
                Math.max(0.1, duration || 3),
                this.getTagNumber(
                    tags,
                    'enemy-damage-down:',
                ),
                tuning.slowRatio ?? 0,
                tuning.slowRatio
                    ? 2
                    : 0,
            );
        } else if (
            tuning.slowRatio &&
            tuning.slowRatio > 0
        ) {
            const slowRatio =
                target.rank === 'boss'
                    ? Math.min(
                        0.30,
                        tuning.slowRatio,
                    )
                    : tuning.slowRatio;

            EnemyStatusSystem.applySlow(
                target.id,
                `skill:${skill.id}:slow`,
                slowRatio,
                Math.max(0.1, duration || 2),
            );
        }

        if (
            tuning.stunDuration &&
            tuning.stunDuration > 0
        ) {
            if (
                skill.id ===
                'mage_frost_nova'
            ) {
                EnemyStatusSystem.applyFreeze(
                    target.id,
                    target.rank,
                    `skill:${skill.id}:freeze`,
                    tuning.stunDuration,
                );
            } else {
                EnemyStatusSystem.applyStun(
                    target.id,
                    target.rank,
                    `skill:${skill.id}:stun`,
                    tuning.stunDuration,
                );
            }
        }
    }

    private static getTagNumber(
        tags: readonly string[] | undefined,
        prefix: string,
    ): number {
        const tag =
            tags?.find(
                (entry) =>
                    entry.startsWith(prefix),
            );

        if (!tag) {
            return 0;
        }

        const value =
            Number(
                tag.slice(prefix.length),
            );

        return Number.isFinite(value)
            ? value
            : 0;
    }

    private static applyTimedModifier(
        actor: HeroSkillActor,
        modifierId: string,
        tuning: ReturnType<typeof getSkillLevelTuning>,
    ): void {
        const duration =
            tuning.duration ?? 0;

        if (duration <= 0) {
            return;
        }

        const attackBonus =
            tuning.attackBonus ?? 0;
        const attackSpeedBonus =
            tuning.attackSpeedBonus ?? 0;
        const moveSpeedBonus =
            tuning.moveSpeedBonus ?? 0;
        const damageReduction =
            tuning.damageReduction ?? 0;

        if (
            attackBonus <= 0 &&
            attackSpeedBonus <= 0 &&
            moveSpeedBonus <= 0 &&
            damageReduction <= 0
        ) {
            return;
        }

        StatusEffectSystem.instance
            ?.applyHeroModifier(
                actor.combatant,
                modifierId,
                {
                    attackMultiplier:
                        1 + attackBonus,
                    attackSpeedMultiplier:
                        1 + attackSpeedBonus,
                    moveSpeedMultiplier:
                        1 + moveSpeedBonus,
                    damageReduction,
                },
                duration,
            );
    }

    private static applyKnockback(
        source: Node,
        target: Node,
        distance: number,
    ): void {
        if (
            !source.isValid ||
            !target.isValid
        ) {
            return;
        }

        const dx =
            target.position.x -
            source.position.x;
        const dy =
            target.position.y -
            source.position.y;
        const length =
            Math.max(
                0.001,
                Math.sqrt(
                    dx * dx +
                    dy * dy,
                ),
            );

        target.setPosition(
            target.position.x +
                dx / length * distance,
            target.position.y +
                dy / length * distance,
            target.position.z,
        );
    }

    private static showPulse(
        target: Node,
        radius: number,
        color: Color,
    ): void {
        this.showPulseAt(
            target.parent,
            target.position,
            radius,
            color,
        );
    }

    private static showPulseAt(
        parent: Node | null,
        position: Vec3,
        radius: number,
        color: Color,
    ): void {
        if (!parent) {
            return;
        }

        const node =
            BattleEffectPool
                .acquirePulse();

        parent.addChild(node);
        node.setPosition(position);

        const transform =
            node.getComponent(
                UITransform,
            ) ??
            node.addComponent(
                UITransform,
            );

        transform.setContentSize(
            radius * 2,
            radius * 2,
        );

        const graphics =
            node.getComponent(
                Graphics,
            ) ??
            node.addComponent(
                Graphics,
            );

        graphics.clear();
        graphics.strokeColor = color;
        graphics.lineWidth = 10;
        graphics.circle(
            0,
            0,
            radius * 0.55,
        );
        graphics.stroke();

        node.setScale(
            new Vec3(
                0.6,
                0.6,
                1,
            ),
        );

        tween(node)
            .to(
                0.25,
                {
                    scale:
                        new Vec3(
                            1.15,
                            1.15,
                            1,
                        ),
                },
            )
            .call(
                () =>
                    BattleEffectPool
                        .releasePulse(
                            node,
                        ),
            )
            .start();
    }
}
