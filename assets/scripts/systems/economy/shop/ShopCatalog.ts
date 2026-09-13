import {
    ShopOfferDefinition,
    ShopOfferId,
} from './ShopTypes';

const OFFERS:
    Readonly<Record<ShopOfferId, ShopOfferDefinition>> = {
        daily_free_supply: {
            id: 'daily_free_supply',
            category: 'daily',
            name: '每日补给',
            description: '每天免费领取一次基础养成材料。',
            visual: 'supply',
            featured: true,
            price: {
                currency: 'coin',
                amount: 0,
            },
            rewards: [
                {
                    itemId: 'monster_essence',
                    amount: 30,
                },
                {
                    itemId: 'upgrade_stone',
                    amount: 2,
                },
            ],
            dailyLimit: 1,
        },

        growth_bundle: {
            id: 'growth_bundle',
            category: 'bundle',
            name: '英雄成长礼包',
            description: '英雄培养常用资源，适合前期快速建立养成库存。',
            visual: 'growth',
            featured: true,
            price: {
                currency: 'gem',
                amount: 35,
            },
            rewards: [
                {
                    itemId: 'exp_book',
                    amount: 4,
                },
                {
                    itemId: 'skill_book',
                    amount: 1,
                },
                {
                    itemId: 'hero_shard',
                    amount: 5,
                },
            ],
            dailyLimit: 2,
        },

        defender_bundle: {
            id: 'defender_bundle',
            category: 'bundle',
            name: '守城补强礼包',
            description: '雕像修复与进阶材料组合。',
            visual: 'defense',
            featured: false,
            price: {
                currency: 'gem',
                amount: 55,
            },
            rewards: [
                {
                    itemId: 'tower_repair_stone',
                    amount: 2,
                },
                {
                    itemId: 'advanced_material',
                    amount: 3,
                },
                {
                    itemId: 'upgrade_stone',
                    amount: 5,
                },
            ],
            dailyLimit: 1,
        },

        adventure_bundle: {
            id: 'adventure_bundle',
            category: 'bundle',
            name: '冒险补给礼包',
            description: '宝箱、钥匙与召唤资源组合。',
            visual: 'chest',
            featured: true,
            price: {
                currency: 'gem',
                amount: 45,
            },
            rewards: [
                {
                    itemId: 'key',
                    amount: 3,
                },
                {
                    itemId: 'equipment_chest',
                    amount: 1,
                },
                {
                    itemId: 'summon_scroll',
                    amount: 1,
                },
            ],
            dailyLimit: 1,
        },

        upgrade_stone_pack: {
            id: 'upgrade_stone_pack',
            category: 'material',
            name: '强化石补给',
            description: '获得 3 个强化石。',
            visual: 'stone',
            featured: true,
            price: {
                currency: 'coin',
                amount: 120,
            },
            rewards: [
                {
                    itemId: 'upgrade_stone',
                    amount: 3,
                },
            ],
            dailyLimit: 10,
        },

        magic_dust_pack: {
            id: 'magic_dust_pack',
            category: 'material',
            name: '魔法粉尘补给',
            description: '获得 10 份魔法粉尘。',
            visual: 'magic',
            featured: false,
            price: {
                currency: 'coin',
                amount: 150,
            },
            rewards: [
                {
                    itemId: 'magic_dust',
                    amount: 10,
                },
            ],
            dailyLimit: 10,
        },

        iron_pack: {
            id: 'iron_pack',
            category: 'material',
            name: '铁锭补给',
            description: '获得 20 个铁锭。',
            visual: 'iron',
            featured: false,
            price: {
                currency: 'coin',
                amount: 100,
            },
            rewards: [
                {
                    itemId: 'iron',
                    amount: 20,
                },
            ],
            dailyLimit: 10,
        },

        magic_crystal_pack: {
            id: 'magic_crystal_pack',
            category: 'material',
            name: '魔能结晶补给',
            description: '获得 5 个魔能结晶。',
            visual: 'crystal',
            featured: false,
            price: {
                currency: 'gem',
                amount: 20,
            },
            rewards: [
                {
                    itemId: 'magic_crystal',
                    amount: 5,
                },
            ],
            dailyLimit: 5,
        },
    };

export class ShopCatalog {
    static get(
        id:
            ShopOfferId,
    ):
        ShopOfferDefinition {
        return OFFERS[id];
    }

    static getAll():
        readonly ShopOfferDefinition[] {
        return [
            OFFERS.daily_free_supply,
            OFFERS.growth_bundle,
            OFFERS.defender_bundle,
            OFFERS.adventure_bundle,
            OFFERS.upgrade_stone_pack,
            OFFERS.magic_dust_pack,
            OFFERS.iron_pack,
            OFFERS.magic_crystal_pack,
        ];
    }

    static isOfferId(
        value:
            string,
    ):
        value is ShopOfferId {
        return value in OFFERS;
    }
}
