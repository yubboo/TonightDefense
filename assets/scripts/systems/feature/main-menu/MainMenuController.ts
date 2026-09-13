import {
    _decorator,
    Component,
    director,
    isValid,
    Node,
} from 'cc';

import {
    MainMenuView,
} from '../../../ui/panels/main-menu/MainMenuView';

import {
    BootLoadingView,
} from '../../../ui/boot/BootLoadingView';

import {
    MainMenuArt,
} from '../../../ui/panels/main-menu/widgets/MainMenuArt';

import {
    MainMenuActionResult,
    MainMenuMealId,
    MainMenuMetaState,
} from '../../../ui/panels/main-menu/MainMenuModels';

import {
    CurrencyService,
} from '../../economy/CurrencyService';

import {
    ShopService,
} from '../../economy/shop/ShopService';

import type {
    ShopOfferId,
} from '../../economy/shop/ShopTypes';

import {
    InventoryService,
} from '../../storage/inventory/runtime/InventoryService';

import {
    ItemCatalog,
} from '../../storage/item/definition/ItemCatalog';

import {
    StageChestService,
} from '../../level/stage/StageChestService';

import {
    ChapterProgressService,
} from '../../level/stage/ChapterProgressService';

import {
    GameplaySessionState,
} from '../../gameplay/runtime/GameplaySessionState';

import {
    StageChestStar,
} from '../../reward/data/StageChestRewardConfig';

import {
    StaminaService,
} from '../stamina/StaminaService';

import {
    AccountService,
} from '../../account/auth/AccountService';

import {
    MealId,
} from '../stamina/StaminaTypes';

import {
    GamePerformanceSettings,
} from '../settings/GamePerformanceSettings';

import {
    AudioManager,
} from '../../audio/AudioManager';

const {
    ccclass,
} = _decorator;

@ccclass('MainMenuController')
export class MainMenuController
extends Component {
    private view:
        MainMenuView | null =
        null;

    private loading =
        false;

    start(): void {
        GamePerformanceSettings
            .ensureApplied();

        AudioManager.playBgm(
            'menu',
            0.45,
        );

        void this.initializeApplication();
    }

    onDestroy(): void {
        this.view?.destroy();
        this.view = null;
    }

    private async initializeApplication():
        Promise<void> {
        const canvas =
            this.resolveCanvas();

        if (!canvas) {
            console.error(
                '[今晚守城] MainMenuController 找不到 Canvas（画布）',
            );
            return;
        }

        const boot =
            new BootLoadingView(
                canvas,
            );

        const run =
            async ():
                Promise<void> => {
                boot.setProgress(
                    0.08,
                    '正在初始化游戏…',
                );

                boot.setProgress(
                    0.22,
                    '正在连接微信账号…',
                );

                const login =
                    await AccountService
                        .login();

                if (!login.ok) {
                    boot.showError(
                        login.message,
                        () => {
                            void run();
                        },
                    );
                    return;
                }

                boot.setProgress(
                    0.55,
                    login.message,
                );

                boot.setProgress(
                    0.68,
                    '正在加载大厅资源…',
                );

                await MainMenuArt
                    .preloadRequired();

                if (
                    !isValid(
                        this.node,
                        true,
                    ) ||
                    !isValid(
                        canvas,
                        true,
                    )
                ) {
                    boot.destroy();
                    return;
                }

                boot.setProgress(
                    0.88,
                    '正在同步玩家资料…',
                );

                this.createMainMenu(
                    canvas,
                );

                await boot.finish();
            };

        await run();
    }

    private createMainMenu(
        canvas:
            Node,
    ): void {
        this.view =
            new MainMenuView(
                canvas,
                {
                    getMetaState:
                        () =>
                            this.getMetaState(),

                    onStartBattle:
                        () =>
                            this.startBattle(),

                    onBuyStamina:
                        () =>
                            this.buyStamina(),

                    getShopSnapshot:
                        () =>
                            ShopService
                                .getSnapshot(),

                    onBuyShopOffer:
                        (
                            offerId,
                        ) =>
                            this.buyShopOffer(
                                offerId,
                            ),

                    onClaimMeal:
                        (
                            mealId,
                        ) =>
                            this.claimMeal(
                                mealId,
                            ),

                    onClaimStageChest:
                        (
                            star,
                        ) =>
                            this.claimStageChest(
                                star,
                            ),

                    onQuickEntry:
                        (
                            entry,
                        ) =>
                            this.onQuickEntry(
                                entry,
                            ),
                },
            );

        // 只预加载战斗场景，不提前启动战斗逻辑。
        director.preloadScene(
            'Battle',
            (
                error,
            ) => {
                if (error) {
                    console.warn(
                        '[今晚守城] Battle.scene 预加载失败',
                        error,
                    );
                }
            },
        );
    }

    private resolveCanvas():
        Node | null {
        if (
            this.node.name ===
            'Canvas'
        ) {
            return this.node;
        }

        if (
            this.node.parent
                ?.name ===
            'Canvas'
        ) {
            return this.node
                .parent;
        }

        return (
            director
                .getScene()
                ?.getChildByName(
                    'Canvas',
                ) ??
            null
        );
    }

    private startBattle(): void {
        if (
            this.loading
        ) {
            return;
        }

        const consume =
            StaminaService
                .tryConsumeBattle();

        if (
            !consume.ok
        ) {
            this.view?.showToast(
                consume.message,
            );
            return;
        }

        this.loading = true;

        this.view?.setLoading(
            true,
        );

        director.loadScene(
            'Battle',
            (
                error,
            ) => {
                if (!error) {
                    return;
                }

                this.loading = false;

                StaminaService
                    .refundBattleCost();

                this.view
                    ?.setLoading(
                        false,
                    );

                this.view
                    ?.showToast(
                        '进入战斗失败，请确认 Battle.scene 已保存',
                    );

                console.error(
                    '[今晚守城] Battle.scene 加载失败',
                    error,
                );
            },
        );
    }

    private getMetaState():
        MainMenuMetaState {
        const stamina =
            StaminaService
                .getSnapshot();

        const currency =
            CurrencyService
                .getSnapshot();

        const warehouseItems =
            InventoryService
                .getAll()
                .map(
                    (
                        stack,
                    ) => {
                        const item =
                            ItemCatalog
                                .get(
                                    stack
                                        .itemId,
                                );

                        return {
                            itemId:
                                stack
                                    .itemId,

                            name:
                                item.name,

                            count:
                                stack
                                    .count,

                            rarity:
                                item
                                    .rarity,
                        };
                    },
                );

        const session =
            GameplaySessionState
                .get();

        const chapterNumber =
            session
                .chapterNumber;

        const chapterProgress =
            ChapterProgressService
                .getState(
                    chapterNumber,
                );

        const stageChest =
            StageChestService
                .getState(
                    chapterNumber,
                );

        const account =
            AccountService
                .getCurrent();

        return {
            playerProfile: {
                uid:
                    account.profile.uid,

                nickname:
                    account.profile.nickname,

                avatarUrl:
                    account.profile.avatarUrl,

                level:
                    account.profile.level,

                cloudBound:
                    account.cloudBound,

                online:
                    account.online,
            },

            stamina:
                stamina.stamina,

            dailyBaseStamina:
                stamina.dailyBase,

            battleStaminaCost:
                stamina.battleCost,

            coins:
                currency.coin,

            gems:
                currency.gem,

            staminaPurchaseCount:
                stamina
                    .purchaseCount,

            staminaPurchaseLimit:
                stamina
                    .purchaseLimit,

            nextStaminaPurchaseCost:
                stamina
                    .nextPurchaseCost,

            staminaPurchaseReward:
                stamina
                    .purchaseReward,

            meals:
                stamina.meals.map(
                    (
                        meal,
                    ) => ({
                        id:
                            meal.id,

                        label:
                            meal.label,

                        timeLabel:
                            meal
                                .timeLabel,

                        reward:
                            meal.reward,

                        status:
                            meal.status,
                    }),
                ),

            warehouseItems,

            chapterProgress: {
                chapterNumber:
                    chapterProgress
                        .chapterNumber,

                completedWaves:
                    chapterProgress
                        .completedWaves,

                totalWaves:
                    chapterProgress
                        .totalWaves,
            },

            stageChest: {
                chapterNumber:
                    stageChest
                        .chapterNumber,

                unlockedStars:
                    stageChest
                        .unlockedStars,

                claimedStars:
                    [
                        ...stageChest
                            .claimedStars,
                    ],
            },
        };
    }

    private buyStamina():
        MainMenuActionResult {
        return StaminaService
            .purchaseStamina();
    }

    private buyShopOffer(
        offerId:
            ShopOfferId,
    ):
        MainMenuActionResult {
        return ShopService
            .tryPurchase(
                offerId,
            );
    }

    private claimMeal(
        mealId:
            MainMenuMealId,
    ):
        MainMenuActionResult {
        return StaminaService
            .claimMeal(
                mealId as
                    MealId,
            );
    }

    private claimStageChest(
        star:
            number,
    ):
        MainMenuActionResult {
        if (
            star !== 1 &&
            star !== 2 &&
            star !== 3
        ) {
            return {
                ok: false,
                message:
                    '无效的阶段宝箱',
            };
        }

        const chapterNumber =
            GameplaySessionState
                .get()
                .chapterNumber;

        return StageChestService
            .claim(
                chapterNumber,
                star as
                    StageChestStar,
            );
    }

    private onQuickEntry(
        entry:
            'territory' |
            'challenge' |
            'sweep' |
            'activity' |
            'more',
    ): void {
        const labelMap = {
            territory:
                '领地',
            challenge:
                '挑战',
            sweep:
                '扫荡',
            activity:
                '活动',
            more:
                '更多',
        } as const;

        this.view?.showToast(
            `${labelMap[entry]}入口已经建立，后续独立开发`,
        );
    }
}
