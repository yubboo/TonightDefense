/**
 * @architecture TonightDefense V1.0
 * @owner battle
 * @module enemy
 */
export type EnemyArchetype =
    | 'melee'
    | 'ranged'
    | 'boss';

export type EnemyRank =
    | 'normal'
    | 'elite'
    | 'boss';

export interface EnemyProfile {
    archetype: EnemyArchetype;
    displayName: string;

    maxHp: number;
    defense: number;
    moveSpeed: number;

    damage: number;
    attackInterval: number;
    attackRange: number;
    aggroRange: number;

    projectileSpeed: number;
    expReward: number;
    visualScale: number;
}

export interface EnemySpawnSpec {
    archetype: EnemyArchetype;
    rank: EnemyRank;

    enemyLevel: number;

    hpMultiplier: number;
    attackMultiplier: number;
    defenseBonus: number;
    speedMultiplier: number;
}

export interface EnemyDeathEvent {
    enemyId: number;
    archetype: EnemyArchetype;
    rank: EnemyRank;
    enemyLevel: number;
}

/**
 * 基础速度刻意压低。
 * 怪物强度主要通过数量、攻击、防御、精英比例增长，
 * 不靠越跑越快制造难度。
 */
export const ENEMY_PROFILES:
    Readonly<
        Record<
            EnemyArchetype,
            EnemyProfile
        >
    > = {
        melee: {
            archetype: 'melee',
            displayName: '近战魔物',

            maxHp: 55,
            defense: 0,
            moveSpeed: 44,

            damage: 11,
            attackInterval: 1.05,
            attackRange: 44,
            aggroRange: 235,

            projectileSpeed: 0,
            expReward: 5,
            visualScale: 0.92,
        },

        ranged: {
            archetype: 'ranged',
            displayName: '远程魔物',

            maxHp: 44,
            defense: 0,
            moveSpeed: 37,

            damage: 9,
            attackInterval: 1.35,
            attackRange: 170,
            aggroRange: 270,

            projectileSpeed: 285,
            expReward: 6,
            visualScale: 0.88,
        },

        boss: {
            archetype: 'boss',
            displayName: '关底首领',

            maxHp: 680,
            defense: 5,
            moveSpeed: 30,

            damage: 27,
            attackInterval: 1.15,
            attackRange: 64,
            aggroRange: 330,

            projectileSpeed: 0,
            expReward: 45,
            visualScale: 1.55,
        },
    } as const;
