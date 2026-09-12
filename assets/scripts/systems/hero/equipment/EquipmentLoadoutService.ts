import {
    InventoryService,
} from '../../storage/inventory/runtime/InventoryService';

import {
    ItemCatalog,
} from '../../storage/item/definition/ItemCatalog';

import {
    ItemId,
} from '../../storage/item/definition/ItemTypes';

import {
    WarehouseRepository,
} from '../../storage/warehouse/repository/WarehouseRepository';

export type EquipmentSlot =
    | 'weapon'
    | 'offhand'
    | 'armor'
    | 'boots'
    | 'helmet'
    | 'ring'
    | 'necklace'
    | 'wings';

export interface EquipmentCombatModifiers {
    attackFlat: number;
    defenseFlat: number;
    maxHpPercent: number;
    moveSpeedPercent: number;
}

interface EquipmentRule {
    itemId: ItemId;
    slot: EquipmentSlot;
    modifiers: EquipmentCombatModifiers;
}

const ZERO:
    EquipmentCombatModifiers = {
        attackFlat: 0,
        defenseFlat: 0,
        maxHpPercent: 0,
        moveSpeedPercent: 0,
    };

const RULES:
    readonly EquipmentRule[] = [
        { itemId: 'weapon_sword', slot: 'weapon', modifiers: { ...ZERO, attackFlat: 4 } },
        { itemId: 'shield', slot: 'offhand', modifiers: { ...ZERO, defenseFlat: 3 } },
        { itemId: 'armor', slot: 'armor', modifiers: { ...ZERO, maxHpPercent: 0.12 } },
        { itemId: 'boots', slot: 'boots', modifiers: { ...ZERO, moveSpeedPercent: 0.08 } },
        { itemId: 'helmet', slot: 'helmet', modifiers: { ...ZERO, defenseFlat: 2, maxHpPercent: 0.05 } },
        { itemId: 'ring', slot: 'ring', modifiers: { ...ZERO, attackFlat: 2 } },
        { itemId: 'necklace', slot: 'necklace', modifiers: { ...ZERO, maxHpPercent: 0.08 } },
        { itemId: 'wings', slot: 'wings', modifiers: { ...ZERO, moveSpeedPercent: 0.12, attackFlat: 3 } },
    ];

/** 装备穿戴与战斗属性结算的唯一入口。 */
export class EquipmentLoadoutService {
    static equip(
        itemId: ItemId,
    ): boolean {
        const definition = ItemCatalog.get(itemId);
        const rule = RULES.find(
            (entry) => entry.itemId === itemId,
        );

        if (
            definition.category !== 'equipment' ||
            !rule ||
            InventoryService.getCount(itemId) <= 0
        ) {
            return false;
        }

        const equipped =
            WarehouseRepository.loadEquipped();
        equipped[rule.slot] = itemId;
        WarehouseRepository.saveEquipped(equipped);
        return true;
    }

    static ensureOwnedEquipmentEquipped(): void {
        const equipped =
            WarehouseRepository.loadEquipped();
        let changed = false;

        for (const rule of RULES) {
            if (
                equipped[rule.slot] ||
                InventoryService.getCount(rule.itemId) <= 0
            ) {
                continue;
            }

            equipped[rule.slot] = rule.itemId;
            changed = true;
        }

        if (changed) {
            WarehouseRepository.saveEquipped(equipped);
        }
    }

    static getCombatModifiers():
        EquipmentCombatModifiers {
        const equipped =
            WarehouseRepository.loadEquipped();
        const total = { ...ZERO };

        for (const itemId of Object.values(equipped)) {
            const rule = RULES.find(
                (entry) => entry.itemId === itemId,
            );

            if (!rule) {
                continue;
            }

            total.attackFlat += rule.modifiers.attackFlat;
            total.defenseFlat += rule.modifiers.defenseFlat;
            total.maxHpPercent += rule.modifiers.maxHpPercent;
            total.moveSpeedPercent += rule.modifiers.moveSpeedPercent;
        }

        return total;
    }
}
