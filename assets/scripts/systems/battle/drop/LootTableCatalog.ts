import {
    EnemyContentId,
} from '../enemy/definition/EnemyContentTypes';

import {
    ItemId,
} from '../../storage/item/definition/ItemTypes';

export interface LootItemEntry {
    itemId: ItemId;
    chance: number;
    min: number;
    max: number;
}

export interface LootTableDefinition {
    id: string;
    enemyId: EnemyContentId;
    items: readonly LootItemEntry[];
}

/**
 * 内容级掉落表预留。
 *
 * 当前可运行战斗仍使用 EnemyDropConfig（按 rank/archetype）。
 * 等具体敌人真正接入后，再由 DropSystem 切换为“敌人ID -> 掉落表”。
 * 这样不会为了搭骨架破坏现有可运行平衡。
 */
export const LOOT_TABLE_CATALOG:
    readonly LootTableDefinition[] = [
        {
            id: 'elite_potion_witch',
            enemyId: 'potion_witch',
            items: [
                {
                    itemId: 'monster_essence',
                    chance: 0.65,
                    min: 1,
                    max: 3,
                },
                {
                    itemId: 'magic_dust',
                    chance: 0.30,
                    min: 1,
                    max: 2,
                },
            ],
        },
        {
            id: 'boss_flame_dragon',
            enemyId: 'flame_dragon',
            items: [
                {
                    itemId: 'upgrade_stone',
                    chance: 1,
                    min: 3,
                    max: 6,
                },
                {
                    itemId: 'dragon_scale',
                    chance: 0.70,
                    min: 1,
                    max: 3,
                },
                {
                    itemId: 'tower_repair_stone',
                    chance: 0.35,
                    min: 1,
                    max: 1,
                },
            ],
        },
    ];
