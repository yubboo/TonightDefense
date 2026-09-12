import {
    RewardBundle,
} from '../RewardTypes';

export type StageChestStar =
    1 | 2 | 3;

/**
 * 星级阶段宝箱 V1 默认奖励。
 *
 * 星级“如何获得”由 LevelSystem 决定。
 * 本文件只定义“打开某星宝箱给什么”。
 *
 * 后续平衡数值只改这里。
 */
export const STAGE_CHEST_REWARDS:
    Readonly<
        Record<
            StageChestStar,
            RewardBundle
        >
    > = {
        1: {
            currencies: [
                {
                    id: 'coin',
                    amount: 100,
                },
            ],
            items: [
                {
                    itemId:
                        'monster_essence',
                    amount: 3,
                },
            ],
        },

        2: {
            currencies: [
                {
                    id: 'coin',
                    amount: 200,
                },
                {
                    id: 'gem',
                    amount: 5,
                },
            ],
            items: [
                {
                    itemId:
                        'upgrade_stone',
                    amount: 3,
                },
            ],
        },

        3: {
            currencies: [
                {
                    id: 'coin',
                    amount: 300,
                },
                {
                    id: 'gem',
                    amount: 10,
                },
            ],
            items: [
                {
                    itemId:
                        'tower_repair_stone',
                    amount: 1,
                },
            ],
        },
    };
