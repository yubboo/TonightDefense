import { sys } from 'cc';

import {
    CurrencyService,
} from '../../economy/CurrencyService';
import { STAMINA_CONFIG } from './StaminaConfig';

import {
    MealClaimStatus,
    MealId,
    MealWindowState,
    StaminaActionResult,
    StaminaSnapshot,
} from './StaminaTypes';

interface StaminaSaveData {
    version: 1;
    dayKey: string;
    stamina: number;
    purchaseCount: number;
    claimedMeals: MealId[];
}

/**
 * 《今晚守城》局外体力。
 *
 * - 初次进入 300
 * - 新的一天：低于300补到300；超过300不扣回去
 * - 开始战斗 -5
 * - 商店 +30/次，每日最多5次
 * - 四餐各 +30，每餐每天一次
 */
export class StaminaService {
    private static readonly STORAGE_KEY =
        'TonightDefense.Stamina.V1';

    private static loaded = false;

    private static data: StaminaSaveData = {
        version: 1,
        dayKey: '',
        stamina: STAMINA_CONFIG.dailyBase,
        purchaseCount: 0,
        claimedMeals: [],
    };

    static getSnapshot(
        now = new Date(),
    ): StaminaSnapshot {
        this.ensureLoaded(now);

        const nextPurchaseCost =
            STAMINA_CONFIG.purchaseCosts[
                this.data.purchaseCount
            ] ?? null;

        return {
            stamina: this.data.stamina,
            dailyBase:
                STAMINA_CONFIG.dailyBase,
            battleCost:
                STAMINA_CONFIG.battleCost,
            purchaseCount:
                this.data.purchaseCount,
            purchaseLimit:
                STAMINA_CONFIG.purchaseCosts.length,
            nextPurchaseCost,
            purchaseReward:
                STAMINA_CONFIG.purchaseReward,
            meals:
                STAMINA_CONFIG.meals.map(
                    (meal) =>
                        this.buildMealState(
                            meal,
                            now,
                        ),
                ),
        };
    }

    static tryConsumeBattle():
        StaminaActionResult {
        this.ensureLoaded(
            new Date(),
        );

        const cost =
            STAMINA_CONFIG.battleCost;

        if (
            this.data.stamina <
            cost
        ) {
            return {
                ok: false,
                message:
                    `体力不足：开始战斗需要 ${cost} 点体力`,
            };
        }

        this.data.stamina -= cost;
        this.save();

        return {
            ok: true,
            message:
                `已消耗 ${cost} 点体力`,
        };
    }


    /**
     * 统一体力增加入口。
     * RewardSystem、四餐、活动等都可以使用。
     */
    static addStamina(
        amount: number,
    ): number {
        this.ensureLoaded(
            new Date(),
        );

        const safe =
            Math.max(
                0,
                Math.floor(
                    amount,
                ),
            );

        if (
            safe <=
            0
        ) {
            return this.data.stamina;
        }

        this.data.stamina += safe;
        this.save();

        return this.data.stamina;
    }

    static refundBattleCost(): void {
        this.ensureLoaded(
            new Date(),
        );

        this.data.stamina +=
            STAMINA_CONFIG.battleCost;

        this.save();
    }

    static purchaseStamina():
        StaminaActionResult {
        this.ensureLoaded(
            new Date(),
        );

        const index =
            this.data.purchaseCount;

        const cost =
            STAMINA_CONFIG.purchaseCosts[
                index
            ];

        if (cost === undefined) {
            return {
                ok: false,
                message:
                    '今天的5次体力购买已经用完',
            };
        }

        if (
            !CurrencyService.trySpend(
                'coin',
                cost,
                'stamina-purchase',
            )
        ) {
            return {
                ok: false,
                message:
                    `金币不足：第${index + 1}次购买需要 ${cost} 金币`,
            };
        }

        this.data.stamina +=
            STAMINA_CONFIG.purchaseReward;

        this.data.purchaseCount += 1;

        this.save();

        return {
            ok: true,
            message:
                `购买成功：+${STAMINA_CONFIG.purchaseReward} 体力`,
        };
    }

    static claimMeal(
        mealId: MealId,
        now = new Date(),
    ): StaminaActionResult {
        this.ensureLoaded(now);

        const config =
            STAMINA_CONFIG.meals.find(
                (item) =>
                    item.id === mealId,
            );

        if (!config) {
            return {
                ok: false,
                message:
                    '找不到该餐次',
            };
        }

        if (
            this.data.claimedMeals
                .indexOf(mealId) >= 0
        ) {
            return {
                ok: false,
                message:
                    `${config.label}体力今天已经领取`,
            };
        }

        const status =
            this.getMealStatus(
                config.startMinute,
                config.endMinute,
                now,
            );

        if (status === 'waiting') {
            return {
                ok: false,
                message:
                    `${config.label}还没到领取时间：${this.formatWindow(config.startMinute, config.endMinute)}`,
            };
        }

        if (status === 'expired') {
            return {
                ok: false,
                message:
                    `${config.label}领取时间已经结束`,
            };
        }

        this.data.stamina +=
            config.reward;

        this.data.claimedMeals.push(
            mealId,
        );

        this.save();

        return {
            ok: true,
            message:
                `${config.label}领取成功：+${config.reward} 体力`,
        };
    }

    private static ensureLoaded(
        now: Date,
    ): void {
        if (!this.loaded) {
            this.loaded = true;

            const raw =
                sys.localStorage.getItem(
                    this.STORAGE_KEY,
                );

            if (raw) {
                try {
                    const parsed =
                        JSON.parse(raw) as
                            Partial<StaminaSaveData>;

                    this.data = {
                        version: 1,
                        dayKey:
                            String(
                                parsed.dayKey ?? '',
                            ),
                        stamina:
                            Math.max(
                                0,
                                Math.floor(
                                    Number(
                                        parsed.stamina ??
                                        STAMINA_CONFIG.dailyBase,
                                    ),
                                ),
                            ),
                        purchaseCount:
                            Math.max(
                                0,
                                Math.min(
                                    STAMINA_CONFIG.purchaseCosts.length,
                                    Math.floor(
                                        Number(
                                            parsed.purchaseCount ??
                                            0,
                                        ),
                                    ),
                                ),
                            ),
                        claimedMeals:
                            Array.isArray(
                                parsed.claimedMeals,
                            )
                                ? parsed.claimedMeals.filter(
                                    (id): id is MealId =>
                                        id === 'breakfast' ||
                                        id === 'lunch' ||
                                        id === 'dinner' ||
                                        id === 'supper',
                                )
                                : [],
                    };
                } catch (error) {
                    console.warn(
                        '[体力] 本地存档读取失败，重建体力存档',
                        error,
                    );

                    this.data = {
                        version: 1,
                        dayKey: '',
                        stamina:
                            STAMINA_CONFIG.dailyBase,
                        purchaseCount: 0,
                        claimedMeals: [],
                    };
                }
            }
        }

        this.rollDaily(now);
    }

    private static rollDaily(
        now: Date,
    ): void {
        const today =
            this.getDayKey(now);

        if (
            this.data.dayKey ===
            today
        ) {
            return;
        }

        this.data.stamina = Math.max(
            this.data.stamina,
            STAMINA_CONFIG.dailyBase,
        );

        this.data.dayKey = today;
        this.data.purchaseCount = 0;
        this.data.claimedMeals = [];

        this.save();
    }

    private static buildMealState(
        config:
            typeof STAMINA_CONFIG
                .meals[number],
        now: Date,
    ): MealWindowState {
        const claimed =
            this.data.claimedMeals
                .indexOf(config.id) >= 0;

        const status:
            MealClaimStatus =
                claimed
                    ? 'claimed'
                    : this.getMealStatus(
                        config.startMinute,
                        config.endMinute,
                        now,
                    );

        return {
            id: config.id,
            label: config.label,
            timeLabel:
                this.formatWindow(
                    config.startMinute,
                    config.endMinute,
                ),
            reward: config.reward,
            status,
        };
    }

    private static getMealStatus(
        startMinute: number,
        endMinute: number,
        now: Date,
    ): Exclude<
        MealClaimStatus,
        'claimed'
    > {
        const minute =
            now.getHours() * 60 +
            now.getMinutes();

        if (minute < startMinute) {
            return 'waiting';
        }

        if (minute > endMinute) {
            return 'expired';
        }

        return 'claimable';
    }

    private static getDayKey(
        date: Date,
    ): string {
        const y = date.getFullYear();

        const m =
            this.twoDigit(
                date.getMonth() + 1,
            );

        const d =
            this.twoDigit(
                date.getDate(),
            );

        return `${y}-${m}-${d}`;
    }

    private static formatWindow(
        startMinute: number,
        endMinute: number,
    ): string {
        const format = (
            minute: number,
        ): string => {
            const h =
                Math.floor(
                    minute / 60,
                );

            const m =
                minute % 60;

            return `${this.twoDigit(h)}:${this.twoDigit(m)}`;
        };

        return `${format(startMinute)}-${format(endMinute)}`;
    }

    private static twoDigit(
        value: number,
    ): string {
        return value < 10
            ? `0${value}`
            : `${value}`;
    }

    private static save(): void {
        sys.localStorage.setItem(
            this.STORAGE_KEY,
            JSON.stringify(
                this.data,
            ),
        );
    }
}
