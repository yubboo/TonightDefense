import {
    EnemyArchetype,
    EnemyRank,
} from '../enemy/EnemyTypes';

import {
    ItemId,
} from '../../item/definition/ItemTypes';

export interface DropRange {
    min: number;
    max: number;
}

export interface ItemDropRule {
    itemId: ItemId;
    chance: number;
    amount: DropRange;
}

export interface EnemyDropProfile {
    coin: DropRange;
    items: ItemDropRule[];
}

/**
 * BattleSystem > Drop / 掉落系统
 *
 * 这是 V1 可运行平衡值。
 * 以后觉得金币太多/太少，只改这里。
 */
export function getEnemyDropProfile(
    archetype:
        EnemyArchetype,
    rank:
        EnemyRank,
): EnemyDropProfile {
    if (
        rank ===
        'boss'
    ) {
        return {
            coin: {
                min: 60,
                max: 90,
            },

            items: [
                {
                    itemId:
                        'monster_essence',
                    chance: 1,
                    amount: {
                        min: 3,
                        max: 5,
                    },
                },
                {
                    itemId:
                        'upgrade_stone',
                    chance: 1,
                    amount: {
                        min: 2,
                        max: 4,
                    },
                },
                {
                    itemId:
                        'tower_repair_stone',
                    chance: 0.25,
                    amount: {
                        min: 1,
                        max: 1,
                    },
                },
            ],
        };
    }

    if (
        rank ===
        'elite'
    ) {
        return {
            coin: {
                min: 5,
                max: 9,
            },

            items: [
                {
                    itemId:
                        'monster_essence',
                    chance: 0.38,
                    amount: {
                        min: 1,
                        max: 2,
                    },
                },
                {
                    itemId:
                        'upgrade_stone',
                    chance: 0.10,
                    amount: {
                        min: 1,
                        max: 1,
                    },
                },
            ],
        };
    }

    return {
        coin:
            archetype ===
                'ranged'
                ? {
                    min: 2,
                    max: 4,
                }
                : {
                    min: 1,
                    max: 3,
                },

        items: [
            {
                itemId:
                    'monster_essence',
                chance:
                    archetype ===
                        'ranged'
                        ? 0.14
                        : 0.10,
                amount: {
                    min: 1,
                    max: 1,
                },
            },
        ],
    };
}
