import {
    CurrencyService,
} from '../economy/CurrencyService';

import {
    InventoryService,
} from '../inventory/runtime/InventoryService';

import {
    StaminaService,
} from '../feature/stamina/StaminaService';

import {
    RewardBundle,
    RewardGrantResult,
    RewardSource,
} from './RewardTypes';

/**
 * RewardSystem / 奖励系统
 *
 * 所有“发奖励”统一从这里进入：
 * - 怪物掉落
 * - 星级宝箱
 * - 活动
 * - 邮件
 * - 任务
 *
 * UI、EnemyController、关卡代码不应该各自手写
 * coin += / gem += / item +=。
 */
export class RewardService {
    static grant(
        bundle:
            RewardBundle,
        source:
            RewardSource,
    ): RewardGrantResult {
        const result:
            RewardGrantResult = {
                source,
                currencies: [],
                stamina: 0,
                items: [],
            };

        for (
            const currency
            of bundle.currencies ??
            []
        ) {
            const amount =
                Math.max(
                    0,
                    Math.floor(
                        currency
                            .amount,
                    ),
                );

            if (
                amount <=
                0
            ) {
                continue;
            }

            CurrencyService.add(
                currency.id,
                amount,
                source,
            );

            result
                .currencies
                .push({
                    id:
                        currency.id,
                    amount,
                });
        }

        const stamina =
            Math.max(
                0,
                Math.floor(
                    bundle
                        .stamina ??
                    0,
                ),
            );

        if (
            stamina >
            0
        ) {
            StaminaService
                .addStamina(
                    stamina,
                );

            result.stamina =
                stamina;
        }

        for (
            const item
            of bundle.items ??
            []
        ) {
            const amount =
                Math.max(
                    0,
                    Math.floor(
                        item.amount,
                    ),
                );

            if (
                amount <=
                0
            ) {
                continue;
            }

            InventoryService.add(
                item.itemId,
                amount,
            );

            result.items.push({
                itemId:
                    item.itemId,
                amount,
            });
        }

        return result;
    }
}
