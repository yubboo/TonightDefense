import { sys } from 'cc';

import {
    CurrencyChangeEvent,
    CurrencyChangeListener,
    CurrencyId,
    CurrencySnapshot,
    CurrencySource,
} from './CurrencyTypes';

interface CurrencySaveData {
    version: 2;
    balances: CurrencySnapshot;
}

/**
 * EconomySystem / 经济系统
 *
 * 统一管理金币、钻石。
 *
 * 旧 CoinService 不再拥有任何状态，只作为兼容壳转发到这里。
 * 这样项目中不会同时存在两套金币余额。
 */
export class CurrencyService {
    private static readonly STORAGE_KEY =
        'TonightDefense.Currency.V2';

    private static readonly OLD_COIN_KEY =
        'TonightDefense.CoinWallet.V1';

    private static loaded = false;

    private static balances: CurrencySnapshot = {
        coin: 0,
        gem: 0,
    };

    private static readonly listeners =
        new Set<CurrencyChangeListener>();

    static get(id: CurrencyId): number {
        this.ensureLoaded();
        return this.balances[id];
    }

    static getSnapshot(): CurrencySnapshot {
        this.ensureLoaded();

        return {
            coin: this.balances.coin,
            gem: this.balances.gem,
        };
    }

    static canSpend(
        id: CurrencyId,
        amount: number,
    ): boolean {
        this.ensureLoaded();

        const safe =
            Math.max(0, Math.floor(amount));

        return this.balances[id] >= safe;
    }

    static add(
        id: CurrencyId,
        amount: number,
        source: CurrencySource = 'other',
    ): number {
        this.ensureLoaded();

        const safe =
            Math.max(0, Math.floor(amount));

        if (safe <= 0) {
            return this.balances[id];
        }

        this.balances[id] += safe;
        this.save();

        this.emit({
            id,
            amount: safe,
            balance: this.balances[id],
            source,
        });

        return this.balances[id];
    }

    static trySpend(
        id: CurrencyId,
        amount: number,
        source: CurrencySource = 'other',
    ): boolean {
        this.ensureLoaded();

        const safe =
            Math.max(0, Math.floor(amount));

        if (safe <= 0) {
            return true;
        }

        if (this.balances[id] < safe) {
            return false;
        }

        this.balances[id] -= safe;
        this.save();

        this.emit({
            id,
            amount: -safe,
            balance: this.balances[id],
            source,
        });

        return true;
    }

    static setForMigration(
        id: CurrencyId,
        value: number,
    ): void {
        this.ensureLoaded();

        this.balances[id] =
            Math.max(0, Math.floor(value));

        this.save();

        this.emit({
            id,
            amount: 0,
            balance: this.balances[id],
            source: 'migration',
        });
    }

    static subscribe(
        listener: CurrencyChangeListener,
    ): () => void {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    }

    private static ensureLoaded(): void {
        if (this.loaded) {
            return;
        }

        this.loaded = true;

        const raw =
            sys.localStorage.getItem(
                this.STORAGE_KEY,
            );

        if (raw) {
            try {
                const parsed =
                    JSON.parse(raw) as
                        Partial<CurrencySaveData>;

                this.balances = {
                    coin:
                        Math.max(
                            0,
                            Math.floor(
                                Number(
                                    parsed
                                        .balances
                                        ?.coin ??
                                    0,
                                ),
                            ),
                        ),

                    gem:
                        Math.max(
                            0,
                            Math.floor(
                                Number(
                                    parsed
                                        .balances
                                        ?.gem ??
                                    0,
                                ),
                            ),
                        ),
                };

                return;
            } catch (error) {
                console.warn(
                    '[经济系统] 新版货币存档读取失败，尝试旧金币存档',
                    error,
                );
            }
        }

        /**
         * 自动迁移旧 CoinService 存档。
         */
        let migratedCoin = 0;

        const oldRaw =
            sys.localStorage.getItem(
                this.OLD_COIN_KEY,
            );

        if (oldRaw) {
            try {
                const oldData =
                    JSON.parse(oldRaw) as
                        { coins?: number };

                migratedCoin =
                    Math.max(
                        0,
                        Math.floor(
                            Number(
                                oldData.coins ??
                                0,
                            ),
                        ),
                    );
            } catch {
                migratedCoin = 0;
            }
        }

        this.balances = {
            coin: migratedCoin,
            gem: 0,
        };

        this.save();
    }

    private static emit(
        event: CurrencyChangeEvent,
    ): void {
        for (const listener of this.listeners) {
            listener(event);
        }
    }

    private static save(): void {
        const data: CurrencySaveData = {
            version: 2,
            balances: {
                coin: this.balances.coin,
                gem: this.balances.gem,
            },
        };

        sys.localStorage.setItem(
            this.STORAGE_KEY,
            JSON.stringify(data),
        );
    }
}
