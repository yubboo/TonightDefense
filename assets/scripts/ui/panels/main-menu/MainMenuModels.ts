export interface MainMenuPlayerProfileState {
    uid: string;
    nickname: string;
    avatarUrl: string;
    level: number;
    cloudBound: boolean;
    online: boolean;
}

export type MainMenuMealId =
    | 'breakfast'
    | 'lunch'
    | 'dinner'
    | 'supper';

export type MainMenuMealStatus =
    | 'claimable'
    | 'claimed'
    | 'waiting'
    | 'expired';

export interface MainMenuMealState {
    id: MainMenuMealId;
    label: string;
    timeLabel: string;
    reward: number;
    status: MainMenuMealStatus;
}

export interface MainMenuWarehouseItem {
    itemId: string;
    name: string;
    count: number;
    rarity:
        | 'common'
        | 'rare'
        | 'epic';
}

export interface MainMenuStageChestState {
    chapterNumber: number;
    unlockedStars: number;
    claimedStars: number[];
}


export interface MainMenuChapterProgressState {
    chapterNumber: number;
    completedWaves: number;
    totalWaves: number;
}

export interface MainMenuMetaState {
    playerProfile:
        MainMenuPlayerProfileState;

    stamina: number;
    dailyBaseStamina: number;
    battleStaminaCost: number;

    coins: number;
    gems: number;

    staminaPurchaseCount: number;
    staminaPurchaseLimit: number;
    nextStaminaPurchaseCost: number | null;
    staminaPurchaseReward: number;

    meals: MainMenuMealState[];

    warehouseItems:
        MainMenuWarehouseItem[];

    chapterProgress:
        MainMenuChapterProgressState;

    stageChest:
        MainMenuStageChestState;
}

export interface MainMenuActionResult {
    ok: boolean;
    message: string;
}
