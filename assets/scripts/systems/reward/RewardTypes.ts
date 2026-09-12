import {
    CurrencyId,
    CurrencySource,
} from '../economy/CurrencyTypes';

import {
    ItemId,
} from '../item/definition/ItemTypes';

export type RewardSource =
    CurrencySource
    | 'meal'
    | 'chapter-clear'
    | 'other-reward';

export interface RewardCurrencyEntry {
    id: CurrencyId;
    amount: number;
}

export interface RewardItemEntry {
    itemId: ItemId;
    amount: number;
}

export interface RewardBundle {
    currencies?: RewardCurrencyEntry[];
    stamina?: number;
    items?: RewardItemEntry[];
}

export interface RewardGrantResult {
    source: RewardSource;

    currencies:
        RewardCurrencyEntry[];

    stamina:
        number;

    items:
        RewardItemEntry[];
}
