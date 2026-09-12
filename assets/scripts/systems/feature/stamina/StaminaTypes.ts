export type MealId =
    | 'breakfast'
    | 'lunch'
    | 'dinner'
    | 'supper';

export type MealClaimStatus =
    | 'claimable'
    | 'claimed'
    | 'waiting'
    | 'expired';

export interface MealWindowState {
    id: MealId;
    label: string;
    timeLabel: string;
    reward: number;
    status: MealClaimStatus;
}

export interface StaminaSnapshot {
    stamina: number;
    dailyBase: number;
    battleCost: number;
    purchaseCount: number;
    purchaseLimit: number;
    nextPurchaseCost: number | null;
    purchaseReward: number;
    meals: MealWindowState[];
}

export interface StaminaActionResult {
    ok: boolean;
    message: string;
}
