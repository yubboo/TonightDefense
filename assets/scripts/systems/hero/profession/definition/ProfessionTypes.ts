/**
 * @architecture TonightDefense V1.0
 * @owner profession
 * @module definition
 *
 * ProfessionSystem 只定义“职业”。
 * 不存具体人物名字，不存关卡，不直接控制 UI。
 */
export type ProfessionAttackMode =
    | 'melee'
    | 'ranged'
    | 'magic'
    | 'support';

/**
 * v0.6.6：所有英雄的基础移动速度统一。
 * 职业不再暗藏快慢差异；本局移速成长只能通过三选一/技能效果进入统一 Modifier 链。
 */
export const HERO_BASE_MOVE_SPEED = 138;

export type ProfessionId =
    | 'flame_caster'
    | 'sword_cultivator'
    | 'spirit_alchemist'
    | 'body_cultivator'
    | 'ranger'
    | 'guardian_knight'
    | 'commander'
    | 'demon_bruiser'
    | 'shadow_caster'
    | 'undead_bruiser'
    | 'element_mage'
    | 'priest'
    | 'heavy_warrior'
    | 'demon_lord';

export interface ProfessionBaseStats {
    maxHp: number;
    attackPower: number;
    defense: number;
    moveSpeed: number;
}

export interface ProfessionTheme {
    main: readonly [
        number,
        number,
        number,
    ];

    soft: readonly [
        number,
        number,
        number,
    ];

    dark: readonly [
        number,
        number,
        number,
    ];
}

export interface ProfessionDefinition {
    id: ProfessionId;

    /**
     * 面向玩家的职业名。
     */
    name: string;

    /**
     * 更短的职业定位。
     * 三选一卡片会显示这个。
     */
    roleLabel: string;

    attackMode:
        ProfessionAttackMode;

    baseStats:
        ProfessionBaseStats;

    attackRange: number;
    attackInterval: number;
    projectileSpeed: number;

    theme:
        ProfessionTheme;

    skillTags:
        readonly string[];
}
