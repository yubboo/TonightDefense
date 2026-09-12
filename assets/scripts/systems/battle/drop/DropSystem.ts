import {
    EnemyDeathEvent,
} from '../enemy/EnemyTypes';

import {
    RewardService,
} from '../../reward/RewardService';

import {
    RewardBundle,
    RewardGrantResult,
} from '../../reward/RewardTypes';

import {
    getEnemyDropProfile,
} from './EnemyDropConfig';

/**
 * BattleSystem > Drop
 *
 * 怪物死亡 -> DropSystem 算掉落 -> RewardSystem 发放
 */
export class DropSystem {
    static resolveEnemyDeath(
        event:
            EnemyDeathEvent,
    ): RewardGrantResult {
        const profile =
            getEnemyDropProfile(
                event.archetype,
                event.rank,
            );

        const levelBonus =
            Math.max(
                0,
                Math.floor(
                    (
                        event
                            .enemyLevel -
                        1
                    ) /
                    10,
                ),
            );

        const coin =
            this.randomInt(
                profile.coin.min,
                profile.coin.max,
            ) +
            levelBonus;

        const bundle:
            RewardBundle = {
                currencies: [
                    {
                        id: 'coin',
                        amount: coin,
                    },
                ],

                items: [],
            };

        for (
            const rule
            of profile.items
        ) {
            if (
                Math.random() >
                rule.chance
            ) {
                continue;
            }

            bundle.items!.push({
                itemId:
                    rule.itemId,

                amount:
                    this.randomInt(
                        rule.amount.min,
                        rule.amount.max,
                    ),
            });
        }

        return RewardService.grant(
            bundle,
            'monster-drop',
        );
    }

    private static randomInt(
        min:
            number,
        max:
            number,
    ): number {
        const low =
            Math.ceil(
                Math.min(
                    min,
                    max,
                ),
            );

        const high =
            Math.floor(
                Math.max(
                    min,
                    max,
                ),
            );

        return (
            low +
            Math.floor(
                Math.random() *
                (
                    high -
                    low +
                    1
                ),
            )
        );
    }
}
