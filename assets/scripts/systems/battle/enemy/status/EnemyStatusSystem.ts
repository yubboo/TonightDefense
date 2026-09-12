import type {
    EnemyRank,
} from '../EnemyTypes';

interface SlowRuntime {
    ratio: number;
    remaining: number;
}

interface ControlLockRuntime {
    kind: 'stun' | 'freeze';
    remaining: number;
}

interface TauntRuntime {
    forcedTargetId: string | null;
    remaining: number;
    damageReduction: number;
    afterSlowRatio: number;
    afterSlowDuration: number;
}

export interface HunterMarkRuntime {
    remaining: number;
    damageBonus: number;
    killCooldownReduction: number;
    bonusCritChance: number;
}

interface EnemyStatusRuntime {
    slows: Map<string, SlowRuntime>;
    locks: Map<string, ControlLockRuntime>;
    taunt: TauntRuntime | null;
    hunterMark: HunterMarkRuntime | null;
}

/**
 * EnemyStatusSystem 是敌人控制/标记的唯一状态源。
 *
 * EnemyController 仍然拥有位置、生命、攻击和死亡；这里只保存“状态修正”：
 * slow / stun / freeze / taunt / hunter mark。
 */
export class EnemyStatusSystem {
    private static readonly states =
        new Map<number, EnemyStatusRuntime>();

    static clear(): void {
        this.states.clear();
    }

    static remove(enemyId: number): void {
        this.states.delete(enemyId);
    }

    static update(dt: number): void {
        const safeDt = Math.max(0, dt);

        for (const [enemyId, state] of this.states) {
            for (const [key, slow] of state.slows) {
                slow.remaining -= safeDt;
                if (slow.remaining <= 0) {
                    state.slows.delete(key);
                }
            }

            for (const [key, lock] of state.locks) {
                lock.remaining -= safeDt;
                if (lock.remaining <= 0) {
                    state.locks.delete(key);
                }
            }

            if (state.taunt) {
                state.taunt.remaining -= safeDt;

                if (state.taunt.remaining <= 0) {
                    const afterSlowRatio =
                        state.taunt.afterSlowRatio;
                    const afterSlowDuration =
                        state.taunt.afterSlowDuration;

                    state.taunt = null;

                    if (
                        afterSlowRatio > 0 &&
                        afterSlowDuration > 0
                    ) {
                        this.applySlow(
                            enemyId,
                            'taunt:after-slow',
                            afterSlowRatio,
                            afterSlowDuration,
                        );
                    }
                }
            }

            if (state.hunterMark) {
                state.hunterMark.remaining -= safeDt;
                if (state.hunterMark.remaining <= 0) {
                    state.hunterMark = null;
                }
            }

            if (
                state.slows.size === 0 &&
                state.locks.size === 0 &&
                !state.taunt &&
                !state.hunterMark
            ) {
                this.states.delete(enemyId);
            }
        }
    }

    static applySlow(
        enemyId: number,
        sourceId: string,
        ratio: number,
        duration: number,
    ): void {
        const safeRatio =
            Math.max(
                0,
                Math.min(0.85, ratio),
            );
        const safeDuration =
            Math.max(0, duration);

        if (
            safeRatio <= 0 ||
            safeDuration <= 0
        ) {
            return;
        }

        const state = this.ensure(enemyId);
        const existing = state.slows.get(sourceId);

        if (existing) {
            existing.ratio =
                Math.max(existing.ratio, safeRatio);
            existing.remaining =
                Math.max(existing.remaining, safeDuration);
            return;
        }

        state.slows.set(
            sourceId,
            {
                ratio: safeRatio,
                remaining: safeDuration,
            },
        );
    }

    static applyStun(
        enemyId: number,
        rank: EnemyRank,
        sourceId: string,
        duration: number,
    ): void {
        if (rank === 'boss') {
            return;
        }

        const rankScale =
            rank === 'elite'
                ? 0.60
                : 1;

        this.applyControlLock(
            enemyId,
            sourceId,
            'stun',
            duration * rankScale,
        );
    }

    /** 冻结只对普通敌人完整生效，符合冰霜新星 Lv5 文案。 */
    static applyFreeze(
        enemyId: number,
        rank: EnemyRank,
        sourceId: string,
        duration: number,
    ): void {
        if (rank !== 'normal') {
            return;
        }

        this.applyControlLock(
            enemyId,
            sourceId,
            'freeze',
            duration,
        );
    }

    static applyTaunt(
        enemyId: number,
        rank: EnemyRank,
        forcedTargetId: string,
        duration: number,
        damageReduction: number,
        afterSlowRatio = 0,
        afterSlowDuration = 2,
    ): void {
        const state = this.ensure(enemyId);
        const safeDuration =
            Math.max(0.1, duration);

        const incoming: TauntRuntime = {
            /** Boss 不强制改目标，但仍吃“伤害降低”保护效果。 */
            forcedTargetId:
                rank === 'boss'
                    ? null
                    : forcedTargetId,
            remaining: safeDuration,
            damageReduction:
                Math.max(
                    0,
                    Math.min(0.80, damageReduction),
                ),
            afterSlowRatio:
                Math.max(
                    0,
                    Math.min(0.85, afterSlowRatio),
                ),
            afterSlowDuration:
                Math.max(0, afterSlowDuration),
        };

        if (!state.taunt) {
            state.taunt = incoming;
            return;
        }

        state.taunt.remaining =
            Math.max(
                state.taunt.remaining,
                incoming.remaining,
            );
        state.taunt.damageReduction =
            Math.max(
                state.taunt.damageReduction,
                incoming.damageReduction,
            );
        state.taunt.afterSlowRatio =
            Math.max(
                state.taunt.afterSlowRatio,
                incoming.afterSlowRatio,
            );
        state.taunt.afterSlowDuration =
            Math.max(
                state.taunt.afterSlowDuration,
                incoming.afterSlowDuration,
            );

        if (incoming.forcedTargetId) {
            state.taunt.forcedTargetId =
                incoming.forcedTargetId;
        }
    }

    static applyHunterMark(
        enemyId: number,
        duration: number,
        damageBonus: number,
        killCooldownReduction: number,
        bonusCritChance: number,
    ): void {
        const state = this.ensure(enemyId);
        const incoming: HunterMarkRuntime = {
            remaining: Math.max(0.1, duration),
            damageBonus:
                Math.max(0, damageBonus),
            killCooldownReduction:
                Math.max(0, killCooldownReduction),
            bonusCritChance:
                Math.max(
                    0,
                    Math.min(1, bonusCritChance),
                ),
        };

        if (!state.hunterMark) {
            state.hunterMark = incoming;
            return;
        }

        state.hunterMark.remaining =
            Math.max(
                state.hunterMark.remaining,
                incoming.remaining,
            );
        state.hunterMark.damageBonus =
            Math.max(
                state.hunterMark.damageBonus,
                incoming.damageBonus,
            );
        state.hunterMark.killCooldownReduction =
            Math.max(
                state.hunterMark.killCooldownReduction,
                incoming.killCooldownReduction,
            );
        state.hunterMark.bonusCritChance =
            Math.max(
                state.hunterMark.bonusCritChance,
                incoming.bonusCritChance,
            );
    }

    static getMoveSpeedMultiplier(
        enemyId: number,
    ): number {
        const state = this.states.get(enemyId);

        if (!state) {
            return 1;
        }

        if (state.locks.size > 0) {
            return 0;
        }

        let strongestSlow = 0;
        for (const slow of state.slows.values()) {
            strongestSlow =
                Math.max(
                    strongestSlow,
                    slow.ratio,
                );
        }

        return Math.max(
            0.10,
            1 - strongestSlow,
        );
    }

    static isAttackLocked(
        enemyId: number,
    ): boolean {
        return (
            this.states.get(enemyId)
                ?.locks.size ?? 0
        ) > 0;
    }

    static getForcedTargetId(
        enemyId: number,
    ): string | null {
        return (
            this.states.get(enemyId)
                ?.taunt
                ?.forcedTargetId ??
            null
        );
    }

    static getOutgoingDamageMultiplier(
        enemyId: number,
    ): number {
        const reduction =
            this.states.get(enemyId)
                ?.taunt
                ?.damageReduction ?? 0;

        return Math.max(
            0.20,
            1 - reduction,
        );
    }

    static isHunterMarked(
        enemyId: number,
    ): boolean {
        return Boolean(
            this.states.get(enemyId)
                ?.hunterMark,
        );
    }

    static getHunterMark(
        enemyId: number,
    ): Readonly<HunterMarkRuntime> | null {
        const mark =
            this.states.get(enemyId)
                ?.hunterMark;

        return mark
            ? { ...mark }
            : null;
    }

    static getIncomingDamageMultiplier(
        enemyId: number,
        sourceProfessionId?: string,
    ): number {
        if (sourceProfessionId !== 'ranger') {
            return 1;
        }

        const mark =
            this.states.get(enemyId)
                ?.hunterMark;

        return mark
            ? 1 + mark.damageBonus
            : 1;
    }

    static getBonusCritChance(
        enemyId: number,
        sourceProfessionId?: string,
    ): number {
        if (sourceProfessionId !== 'ranger') {
            return 0;
        }

        return (
            this.states.get(enemyId)
                ?.hunterMark
                ?.bonusCritChance ?? 0
        );
    }

    private static applyControlLock(
        enemyId: number,
        sourceId: string,
        kind: 'stun' | 'freeze',
        duration: number,
    ): void {
        const safeDuration =
            Math.max(0, duration);

        if (safeDuration <= 0) {
            return;
        }

        const state = this.ensure(enemyId);
        const existing = state.locks.get(sourceId);

        if (existing) {
            existing.kind = kind;
            existing.remaining =
                Math.max(
                    existing.remaining,
                    safeDuration,
                );
            return;
        }

        state.locks.set(
            sourceId,
            {
                kind,
                remaining: safeDuration,
            },
        );
    }

    private static ensure(
        enemyId: number,
    ): EnemyStatusRuntime {
        const existing =
            this.states.get(enemyId);

        if (existing) {
            return existing;
        }

        const created: EnemyStatusRuntime = {
            slows: new Map(),
            locks: new Map(),
            taunt: null,
            hunterMark: null,
        };

        this.states.set(enemyId, created);
        return created;
    }
}
