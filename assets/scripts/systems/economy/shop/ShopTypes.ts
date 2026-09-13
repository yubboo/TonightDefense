import type {
    CurrencyId,
} from '../CurrencyTypes';

import type {
    ItemId,
} from '../../storage/item/definition/ItemTypes';

export type ShopCategoryId =
    | 'recommend'
    | 'bundle'
    | 'material'
    | 'cosmetic'
    | 'daily';

export type ShopOfferCategory =
    Exclude<
        ShopCategoryId,
        'recommend'
    >;

export type ShopOfferId =
    | 'daily_free_supply'
    | 'growth_bundle'
    | 'defender_bundle'
    | 'adventure_bundle'
    | 'upgrade_stone_pack'
    | 'magic_dust_pack'
    | 'iron_pack'
    | 'magic_crystal_pack';

export type ShopVisualKey =
    | 'supply'
    | 'growth'
    | 'defense'
    | 'chest'
    | 'stone'
    | 'magic'
    | 'iron'
    | 'crystal';

export interface ShopPrice {
    currency:
        CurrencyId;

    amount:
        number;
}

export interface ShopRewardDefinition {
    itemId:
        ItemId;

    amount:
        number;
}

export interface ShopOfferDefinition {
    id:
        ShopOfferId;

    category:
        ShopOfferCategory;

    name:
        string;

    description:
        string;

    visual:
        ShopVisualKey;

    featured:
        boolean;

    price:
        ShopPrice;

    rewards:
        readonly ShopRewardDefinition[];

    dailyLimit:
        number;
}

export interface ShopRewardSnapshot
extends ShopRewardDefinition {
    name:
        string;
}

export interface ShopOfferSnapshot {
    id:
        ShopOfferId;

    category:
        ShopOfferCategory;

    name:
        string;

    description:
        string;

    visual:
        ShopVisualKey;

    featured:
        boolean;

    price:
        ShopPrice;

    rewards:
        readonly ShopRewardSnapshot[];

    purchasedToday:
        number;

    dailyLimit:
        number;

    remainingToday:
        number;

    soldOut:
        boolean;

    affordable:
        boolean;
}

export interface ShopSnapshot {
    dayKey:
        string;

    offers:
        readonly ShopOfferSnapshot[];
}

export interface ShopPurchaseResult {
    ok:
        boolean;

    message:
        string;
}
