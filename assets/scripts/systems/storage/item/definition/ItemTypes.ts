export type ItemId =
    | 'monster_essence'
    | 'upgrade_stone'
    | 'tower_repair_stone'
    | 'key'
    | 'equipment_chest'
    | 'summon_scroll'
    | 'weapon_sword'
    | 'shield'
    | 'armor'
    | 'boots'
    | 'helmet'
    | 'ring'
    | 'necklace'
    | 'wings'
    | 'hp_potion'
    | 'mp_potion'
    | 'attack_potion'
    | 'defense_potion'
    | 'food'
    | 'exp_book'
    | 'skill_book'
    | 'advanced_material'
    | 'hero_shard'
    | 'artifact_fragment'
    | 'wood'
    | 'stone'
    | 'iron'
    | 'magic_crystal'
    | 'dragon_scale'
    | 'magic_dust';

export type ItemCategory =
    | 'material'
    | 'consumable'
    | 'equipment'
    | 'special';

export type ItemRarity =
    | 'common'
    | 'rare'
    | 'epic'
    | 'legendary';

export interface ItemDefinition {
    id: ItemId;
    name: string;
    category: ItemCategory;
    rarity: ItemRarity;
    stackLimit: number;
    description: string;
    resourcePath?: string;
}
