import {
    EnemyContentDefinition,
    EnemyContentId,
} from './EnemyContentTypes';

const ENEMIES:
    Readonly<Record<EnemyContentId, EnemyContentDefinition>> = {
        slime: {
            id: 'slime',
            name: '史莱姆',
            archetype: 'melee',
            rank: 'normal',
            tags: ['普通怪', '近战'],
            resourceRoot: 'enemies/normal/slime',
            status: 'reference_only',
            designSource: '八大模块完整拆分包/敌人设计',
        },
        goblin: {
            id: 'goblin',
            name: '哥布林',
            archetype: 'ranged',
            rank: 'normal',
            tags: ['普通怪', '远程'],
            resourceRoot: 'enemies/normal/goblin',
            status: 'reference_only',
            designSource: '八大模块完整拆分包/敌人设计',
        },
        skeleton_soldier: {
            id: 'skeleton_soldier',
            name: '骷髅兵',
            archetype: 'melee',
            rank: 'normal',
            tags: ['普通怪', '近战', '亡灵'],
            resourceRoot: 'enemies/normal/skeleton_soldier',
            status: 'reference_only',
            designSource: '八大模块完整拆分包/敌人设计',
        },
        small_bat: {
            id: 'small_bat',
            name: '小蝙蝠',
            archetype: 'melee',
            rank: 'normal',
            tags: ['普通怪', '快速'],
            resourceRoot: 'enemies/normal/small_bat',
            status: 'reference_only',
            designSource: '八大模块完整拆分包/敌人设计',
        },
        wolf_rider: {
            id: 'wolf_rider',
            name: '狼骑士',
            archetype: 'melee',
            rank: 'normal',
            tags: ['普通怪', '突进'],
            resourceRoot: 'enemies/normal/wolf_rider',
            status: 'reference_only',
            designSource: '八大模块完整拆分包/敌人设计',
        },
        potion_witch: {
            id: 'potion_witch',
            name: '魔药巫女',
            archetype: 'ranged',
            rank: 'elite',
            tags: ['精英怪', '远程', '魔药', '状态'],
            resourceRoot: 'enemies/elites/potion_witch',
            status: 'reference_only',
            designSource: '魔药巫女_精英怪拆分包',
        },
        stone_guardian: {
            id: 'stone_guardian',
            name: '石像卫士',
            archetype: 'melee',
            rank: 'elite',
            tags: ['精英怪', '高防御'],
            resourceRoot: 'enemies/elites/stone_guardian',
            status: 'reference_only',
            designSource: '八大模块完整拆分包/敌人设计',
        },
        orc_chieftain: {
            id: 'orc_chieftain',
            name: '兽人酋长',
            archetype: 'melee',
            rank: 'elite',
            tags: ['精英怪', '高攻击'],
            resourceRoot: 'enemies/elites/orc_chieftain',
            status: 'reference_only',
            designSource: '八大模块完整拆分包/敌人设计',
        },
        flame_dragon: {
            id: 'flame_dragon',
            name: '赤金炎龙',
            archetype: 'boss',
            rank: 'boss',
            tags: ['Boss', '火焰', '飞行', '范围技能'],
            resourceRoot: 'enemies/bosses/flame_dragon',
            status: 'runtime_ready',
            designSource: '用户提供赤金炎龙设计板 + 运行时战斗精灵',
        },
        abyss_golem: {
            id: 'abyss_golem',
            name: '深渊魔像',
            archetype: 'boss',
            rank: 'boss',
            tags: ['Boss', '高生命', '控制'],
            resourceRoot: 'enemies/bosses/abyss_golem',
            status: 'reference_only',
            designSource: '八大模块完整拆分包/敌人设计',
        },
        undead_king: {
            id: 'undead_king',
            name: '亡灵君王',
            archetype: 'boss',
            rank: 'boss',
            tags: ['Boss', '亡灵', '召唤'],
            resourceRoot: 'enemies/bosses/undead_king',
            status: 'reference_only',
            designSource: '八大模块完整拆分包/敌人设计',
        },
    };

export class EnemyContentCatalog {
    static get(id: EnemyContentId): EnemyContentDefinition {
        return ENEMIES[id];
    }

    static getAll(): readonly EnemyContentDefinition[] {
        return [
            ENEMIES.slime,
            ENEMIES.goblin,
            ENEMIES.skeleton_soldier,
            ENEMIES.small_bat,
            ENEMIES.wolf_rider,
            ENEMIES.potion_witch,
            ENEMIES.stone_guardian,
            ENEMIES.orc_chieftain,
            ENEMIES.flame_dragon,
            ENEMIES.abyss_golem,
            ENEMIES.undead_king,
        ];
    }
}
