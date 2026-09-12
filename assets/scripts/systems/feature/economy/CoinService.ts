import {
    CurrencyService,
} from '../../economy/CurrencyService';

import {
    CurrencySource,
} from '../../economy/CurrencyTypes';

/**
 * @deprecated
 * 兼容旧调用。
 *
 * 真正的金币状态已经统一迁移到 EconomySystem / CurrencyService。
 * 本类不保存任何数据，因此不会产生“双金币系统”。
 */
export type CoinSource = CurrencySource;

export class CoinService {
    static getCoins(): number {
        return CurrencyService.get('coin');
    }

    static grantCoins(
        amount: number,
        source: CoinSource = 'other',
    ): number {
        return CurrencyService.add(
            'coin',
            amount,
            source,
        );
    }

    static canSpend(
        amount: number,
    ): boolean {
        return CurrencyService.canSpend(
            'coin',
            amount,
        );
    }

    static trySpend(
        amount: number,
        source: CoinSource = 'other',
    ): boolean {
        return CurrencyService.trySpend(
            'coin',
            amount,
            source,
        );
    }

    static setCoinsForMigration(
        coins: number,
    ): void {
        CurrencyService.setForMigration(
            'coin',
            coins,
        );
    }
}
