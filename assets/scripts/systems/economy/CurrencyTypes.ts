export type CurrencyId =
    | 'coin'
    | 'gem';

export type CurrencySource =
    | 'monster-drop'
    | 'stage-chest-1'
    | 'stage-chest-2'
    | 'stage-chest-3'
    | 'stamina-purchase'
    | 'meal'
    | 'chapter-clear'
    | 'other-reward'
    | 'system'
    | 'migration'
    | 'other';

export interface CurrencySnapshot {
    coin: number;
    gem: number;
}

export interface CurrencyChangeEvent {
    id: CurrencyId;
    amount: number;
    balance: number;
    source: CurrencySource;
}

export type CurrencyChangeListener =
    (event: CurrencyChangeEvent) => void;
