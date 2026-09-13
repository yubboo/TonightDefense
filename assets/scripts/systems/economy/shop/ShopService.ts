import {
    sys,
} from 'cc';

import {
    CurrencyService,
} from '../CurrencyService';

import {
    InventoryService,
} from '../../storage/inventory/runtime/InventoryService';

import {
    ItemCatalog,
} from '../../storage/item/definition/ItemCatalog';

import {
    ShopCatalog,
} from './ShopCatalog';

import {
    ShopOfferDefinition,
    ShopOfferId,
    ShopOfferSnapshot,
    ShopPurchaseResult,
    ShopSnapshot,
} from './ShopTypes';

interface ShopSaveData {
    version:
        1;

    dayKey:
        string;

    purchases:
        Partial<Record<ShopOfferId, number>>;
}

/**
 * 商店系统唯一交易入口。
 *
 * - ShopCatalog 只定义商品；
 * - ShopService 管每日购买次数和交易；
 * - CurrencyService 管货币；
 * - InventoryService 管实际道具数量；
 * - UI 只能读取 snapshot / 发起 purchase，不保存购买状态。
 */
export class ShopService {
    private static readonly STORAGE_KEY =
        'TonightDefense.Shop.V1';

    private static loaded =
        false;

    private static data:
        ShopSaveData = {
            version: 1,
            dayKey: '',
            purchases: {},
        };

    static getSnapshot(
        now =
            new Date(),
    ):
        ShopSnapshot {
        this.ensureLoaded(
            now,
        );

        return {
            dayKey:
                this.data.dayKey,

            offers:
                ShopCatalog
                    .getAll()
                    .map(
                        (
                            definition,
                        ) =>
                            this.toSnapshot(
                                definition,
                            ),
                    ),
        };
    }

    static tryPurchase(
        offerId:
            ShopOfferId,
        now =
            new Date(),
    ):
        ShopPurchaseResult {
        this.ensureLoaded(
            now,
        );

        const definition =
            ShopCatalog.get(
                offerId,
            );

        const purchasedToday =
            this.getPurchaseCount(
                offerId,
            );

        if (
            purchasedToday >=
            definition.dailyLimit
        ) {
            return {
                ok: false,
                message:
                    `${definition.name} 今日购买次数已用完`,
            };
        }

        const inventoryCheck =
            this.canReceiveRewards(
                definition,
            );

        if (!inventoryCheck.ok) {
            return inventoryCheck;
        }

        if (
            !CurrencyService.trySpend(
                definition.price.currency,
                definition.price.amount,
                'shop-purchase',
            )
        ) {
            return {
                ok: false,
                message:
                    definition.price.currency ===
                        'coin'
                        ? `金币不足：需要 ${definition.price.amount}`
                        : `钻石不足：需要 ${definition.price.amount}`,
            };
        }

        for (
            const reward
            of definition.rewards
        ) {
            InventoryService.add(
                reward.itemId,
                reward.amount,
            );
        }

        this.data.purchases[
            offerId
        ] =
            purchasedToday +
            1;

        this.save();

        return {
            ok: true,
            message:
                `${definition.name}：${this.formatRewards(definition)}`,
        };
    }

    private static toSnapshot(
        definition:
            ShopOfferDefinition,
    ):
        ShopOfferSnapshot {
        const purchasedToday =
            this.getPurchaseCount(
                definition.id,
            );

        const remainingToday =
            Math.max(
                0,
                definition.dailyLimit -
                    purchasedToday,
            );

        return {
            id:
                definition.id,

            category:
                definition.category,

            name:
                definition.name,

            description:
                definition.description,

            visual:
                definition.visual,

            featured:
                definition.featured,

            price: {
                ...definition.price,
            },

            rewards:
                definition.rewards.map(
                    (
                        reward,
                    ) => ({
                        ...reward,
                        name:
                            ItemCatalog
                                .get(
                                    reward.itemId,
                                )
                                .name,
                    }),
                ),

            purchasedToday,
            dailyLimit:
                definition.dailyLimit,
            remainingToday,
            soldOut:
                remainingToday <=
                0,
            affordable:
                definition.price.amount <=
                    0 ||
                CurrencyService.canSpend(
                    definition.price.currency,
                    definition.price.amount,
                ),
        };
    }

    private static canReceiveRewards(
        definition:
            ShopOfferDefinition,
    ):
        ShopPurchaseResult {
        for (
            const reward
            of definition.rewards
        ) {
            const item =
                ItemCatalog.get(
                    reward.itemId,
                );

            const current =
                InventoryService.getCount(
                    reward.itemId,
                );

            if (
                current +
                    reward.amount >
                item.stackLimit
            ) {
                return {
                    ok: false,
                    message:
                        `${item.name} 已达到持有上限，无法购买`,
                };
            }
        }

        return {
            ok: true,
            message: '',
        };
    }

    private static formatRewards(
        definition:
            ShopOfferDefinition,
    ):
        string {
        return definition
            .rewards
            .map(
                (
                    reward,
                ) =>
                    `${ItemCatalog.get(reward.itemId).name}×${reward.amount}`,
            )
            .join('、');
    }

    private static getPurchaseCount(
        offerId:
            ShopOfferId,
    ):
        number {
        return Math.max(
            0,
            Math.floor(
                Number(
                    this.data
                        .purchases[
                            offerId
                        ] ??
                    0,
                ),
            ),
        );
    }

    private static ensureLoaded(
        now:
            Date,
    ):
        void {
        if (!this.loaded) {
            this.loaded =
                true;

            const raw =
                sys.localStorage
                    .getItem(
                        this.STORAGE_KEY,
                    );

            if (raw) {
                try {
                    const parsed =
                        JSON.parse(
                            raw,
                        ) as
                            Partial<ShopSaveData>;

                    const purchases:
                        Partial<Record<ShopOfferId, number>> =
                        {};

                    if (
                        parsed.purchases &&
                        typeof parsed.purchases ===
                            'object'
                    ) {
                        for (
                            const [
                                rawId,
                                rawCount,
                            ]
                            of Object.entries(
                                parsed.purchases,
                            )
                        ) {
                            if (
                                !ShopCatalog
                                    .isOfferId(
                                        rawId,
                                    )
                            ) {
                                continue;
                            }

                            purchases[
                                rawId
                            ] =
                                Math.max(
                                    0,
                                    Math.floor(
                                        Number(
                                            rawCount ??
                                            0,
                                        ),
                                    ),
                                );
                        }
                    }

                    this.data = {
                        version: 1,
                        dayKey:
                            String(
                                parsed.dayKey ??
                                '',
                            ),
                        purchases,
                    };
                } catch (
                    error
                ) {
                    console.warn(
                        '[商店] 存档读取失败，重建每日购买状态',
                        error,
                    );

                    this.data = {
                        version: 1,
                        dayKey: '',
                        purchases: {},
                    };
                }
            }
        }

        this.rollDaily(
            now,
        );
    }

    private static rollDaily(
        now:
            Date,
    ):
        void {
        const dayKey =
            this.getDayKey(
                now,
            );

        if (
            this.data.dayKey ===
            dayKey
        ) {
            return;
        }

        this.data.dayKey =
            dayKey;

        this.data.purchases =
            {};

        this.save();
    }

    private static getDayKey(
        now:
            Date,
    ):
        string {
        const month =
            `${now.getMonth() + 1}`
                .padStart(
                    2,
                    '0',
                );

        const day =
            `${now.getDate()}`
                .padStart(
                    2,
                    '0',
                );

        return `${now.getFullYear()}-${month}-${day}`;
    }

    private static save():
        void {
        sys.localStorage.setItem(
            this.STORAGE_KEY,
            JSON.stringify(
                this.data,
            ),
        );
    }
}
