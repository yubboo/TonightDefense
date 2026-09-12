import { MealId } from './StaminaTypes';

export interface MealWindowConfig {
    id: MealId;
    label: string;
    startMinute: number;
    endMinute: number;
    reward: number;
}

/**
 * 体力系统配置。
 * 用户尚未指定四餐具体时间，所以先全部集中在这里，
 * 后续只改本文件，不需要动 UI 或业务逻辑。
 */
export const STAMINA_CONFIG = {
    dailyBase: 300,
    battleCost: 5,
    purchaseReward: 30,

    purchaseCosts: [
        100,
        200,
        300,
        400,
        500,
    ] as const,

    meals: [
        {
            id: 'breakfast',
            label: '早餐',
            startMinute: 7 * 60,
            endMinute: 10 * 60 - 1,
            reward: 30,
        },
        {
            id: 'lunch',
            label: '午餐',
            startMinute: 11 * 60,
            endMinute: 14 * 60 - 1,
            reward: 30,
        },
        {
            id: 'dinner',
            label: '晚餐',
            startMinute: 17 * 60,
            endMinute: 20 * 60 - 1,
            reward: 30,
        },
        {
            id: 'supper',
            label: '夜宵',
            startMinute: 21 * 60,
            endMinute: 24 * 60 - 1,
            reward: 30,
        },
    ] as const satisfies readonly MealWindowConfig[],
} as const;
