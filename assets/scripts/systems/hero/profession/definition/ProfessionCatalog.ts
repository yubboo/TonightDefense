/**
 * @architecture TonightDefense V1.0
 * @owner profession
 * @module definition
 */
import {
    HERO_BASE_MOVE_SPEED,
    ProfessionDefinition,
    ProfessionId,
} from './ProfessionTypes';

export const PROFESSION_CATALOG:
    readonly ProfessionDefinition[] = [
        {
            id: 'flame_caster',
            name: '炎术师',
            roleLabel: '爆发法术',
            attackMode: 'magic',

            baseStats: {
                maxHp: 215,
                attackPower: 15,
                defense: 3,
                moveSpeed: HERO_BASE_MOVE_SPEED,
            },

            attackRange: 385,
            attackInterval: 0.72,
            projectileSpeed: 500,

            theme: {
                main: [210, 93, 70],
                soft: [247, 220, 205],
                dark: [132, 55, 43],
            },

            skillTags: [
                '火焰',
                '爆发',
                '范围',
            ],
        },

        {
            id: 'sword_cultivator',
            name: '剑修',
            roleLabel: '近战爆发',
            attackMode: 'melee',

            baseStats: {
                maxHp: 275,
                attackPower: 17,
                defense: 5,
                moveSpeed: HERO_BASE_MOVE_SPEED,
            },

            attackRange: 72,
            attackInterval: 0.56,
            projectileSpeed: 0,

            theme: {
                main: [92, 139, 198],
                soft: [218, 230, 246],
                dark: [58, 88, 133],
            },

            skillTags: [
                '剑气',
                '暴击',
                '近战',
            ],
        },

        {
            id: 'spirit_alchemist',
            name: '灵药师',
            roleLabel: '远程续航',
            attackMode: 'ranged',

            baseStats: {
                maxHp: 235,
                attackPower: 13,
                defense: 4,
                moveSpeed: HERO_BASE_MOVE_SPEED,
            },

            attackRange: 365,
            attackInterval: 0.68,
            projectileSpeed: 480,

            theme: {
                main: [94, 170, 112],
                soft: [220, 240, 218],
                dark: [58, 108, 70],
            },

            skillTags: [
                '灵药',
                '持续',
                '远程',
            ],
        },

        {
            id: 'body_cultivator',
            name: '体修',
            roleLabel: '高血近战',
            attackMode: 'melee',

            baseStats: {
                maxHp: 360,
                attackPower: 14,
                defense: 8,
                moveSpeed: HERO_BASE_MOVE_SPEED,
            },

            attackRange: 68,
            attackInterval: 0.64,
            projectileSpeed: 0,

            theme: {
                main: [193, 127, 70],
                soft: [245, 228, 209],
                dark: [123, 78, 43],
            },

            skillTags: [
                '体魄',
                '护体',
                '近战',
            ],
        },

        {
            id: 'ranger',
            name: '游侠',
            roleLabel: '远程输出',
            attackMode: 'ranged',

            baseStats: {
                maxHp: 225,
                attackPower: 12,
                defense: 3,
                moveSpeed: HERO_BASE_MOVE_SPEED,
            },

            attackRange: 390,
            attackInterval: 0.60,
            projectileSpeed: 525,

            theme: {
                main: [87, 165, 112],
                soft: [217, 239, 216],
                dark: [55, 105, 70],
            },

            skillTags: [
                '远程',
                '攻速',
                '穿透',
            ],
        },

        {
            id: 'guardian_knight',
            name: '守护骑士',
            roleLabel: '前排坦克',
            attackMode: 'melee',

            baseStats: {
                maxHp: 390,
                attackPower: 11,
                defense: 10,
                moveSpeed: HERO_BASE_MOVE_SPEED,
            },

            attackRange: 65,
            attackInterval: 0.82,
            projectileSpeed: 0,

            theme: {
                main: [82, 132, 190],
                soft: [215, 228, 245],
                dark: [53, 87, 128],
            },

            skillTags: [
                '护盾',
                '嘲讽',
                '坦克',
            ],
        },

        {
            id: 'commander',
            name: '统御者',
            roleLabel: '团队增益',
            attackMode: 'support',

            baseStats: {
                maxHp: 250,
                attackPower: 10,
                defense: 5,
                moveSpeed: HERO_BASE_MOVE_SPEED,
            },

            attackRange: 340,
            attackInterval: 0.92,
            projectileSpeed: 420,

            theme: {
                main: [201, 159, 75],
                soft: [246, 235, 204],
                dark: [132, 99, 43],
            },

            skillTags: [
                '增益',
                '光环',
                '团队',
            ],
        },

        {
            id: 'demon_bruiser',
            name: '魔战士',
            roleLabel: '近战输出',
            attackMode: 'melee',

            baseStats: {
                maxHp: 320,
                attackPower: 16,
                defense: 6,
                moveSpeed: HERO_BASE_MOVE_SPEED,
            },

            attackRange: 70,
            attackInterval: 0.62,
            projectileSpeed: 0,

            theme: {
                main: [157, 82, 119],
                soft: [240, 218, 231],
                dark: [101, 52, 76],
            },

            skillTags: [
                '魔战',
                '近战',
                '吸血',
            ],
        },

        {
            id: 'shadow_caster',
            name: '暗影术士',
            roleLabel: '控制法术',
            attackMode: 'magic',

            baseStats: {
                maxHp: 220,
                attackPower: 14,
                defense: 3,
                moveSpeed: HERO_BASE_MOVE_SPEED,
            },

            attackRange: 375,
            attackInterval: 0.80,
            projectileSpeed: 455,

            theme: {
                main: [135, 96, 191],
                soft: [227, 216, 244],
                dark: [84, 59, 126],
            },

            skillTags: [
                '暗影',
                '控制',
                '法术',
            ],
        },

        {
            id: 'undead_bruiser',
            name: '尸鬼战士',
            roleLabel: '续航战士',
            attackMode: 'melee',

            baseStats: {
                maxHp: 345,
                attackPower: 13,
                defense: 6,
                moveSpeed: HERO_BASE_MOVE_SPEED,
            },

            attackRange: 68,
            attackInterval: 0.70,
            projectileSpeed: 0,

            theme: {
                main: [111, 132, 97],
                soft: [224, 234, 215],
                dark: [69, 87, 59],
            },

            skillTags: [
                '续航',
                '近战',
                '亡灵',
            ],
        },

        {
            id: 'element_mage',
            name: '元素法师',
            roleLabel: '范围法术',
            attackMode: 'magic',

            baseStats: {
                maxHp: 220,
                attackPower: 14,
                defense: 3,
                moveSpeed: HERO_BASE_MOVE_SPEED,
            },

            attackRange: 380,
            attackInterval: 0.78,
            projectileSpeed: 465,

            theme: {
                main: [129, 93, 190],
                soft: [226, 214, 245],
                dark: [81, 57, 126],
            },

            skillTags: [
                '火',
                '冰',
                '雷',
                '范围',
            ],
        },

        {
            id: 'priest',
            name: '守护祭司',
            roleLabel: '辅助',
            attackMode: 'support',

            baseStats: {
                maxHp: 255,
                attackPower: 9,
                defense: 5,
                moveSpeed: HERO_BASE_MOVE_SPEED,
            },

            attackRange: 350,
            attackInterval: 0.96,
            projectileSpeed: 415,

            theme: {
                main: [205, 166, 78],
                soft: [247, 236, 205],
                dark: [135, 102, 45],
            },

            skillTags: [
                '治疗',
                '护盾',
                '辅助',
            ],
        },

        {
            id: 'heavy_warrior',
            name: '重装战士',
            roleLabel: '半肉输出',
            attackMode: 'melee',

            baseStats: {
                maxHp: 350,
                attackPower: 14,
                defense: 8,
                moveSpeed: HERO_BASE_MOVE_SPEED,
            },

            attackRange: 68,
            attackInterval: 0.72,
            projectileSpeed: 0,

            theme: {
                main: [102, 127, 166],
                soft: [219, 228, 239],
                dark: [64, 82, 111],
            },

            skillTags: [
                '重装',
                '近战',
                '承伤',
            ],
        },

        {
            id: 'demon_lord',
            name: '魔族领主',
            roleLabel: '强力前排',
            attackMode: 'melee',

            baseStats: {
                maxHp: 380,
                attackPower: 18,
                defense: 8,
                moveSpeed: HERO_BASE_MOVE_SPEED,
            },

            attackRange: 74,
            attackInterval: 0.76,
            projectileSpeed: 0,

            theme: {
                main: [126, 74, 153],
                soft: [230, 215, 239],
                dark: [80, 47, 102],
            },

            skillTags: [
                '领主',
                '魔族',
                '近战',
            ],
        },
    ] as const;

export function getProfessionById(
    id: ProfessionId,
): ProfessionDefinition {
    const found =
        PROFESSION_CATALOG.find(
            (
                profession,
            ) =>
                profession.id === id,
        );

    if (!found) {
        throw new Error(
            `[今晚守城] 未找到职业：${id}`,
        );
    }

    return found;
}
