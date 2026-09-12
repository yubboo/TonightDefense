import {
    BattleArtKey,
} from '../../../../ui/resources/BattleArt';

import {
    ProfessionId,
} from '../../profession/definition/ProfessionTypes';

export const PROFESSION_SKILL_MAX_LEVEL = 5;

export type ProfessionSkillKind =
    | 'passive'
    | 'active';

export type ProfessionSkillTargetMode =
    | 'SELF'
    | 'NEAREST_ENEMY'
    | 'HIGHEST_HP_ENEMY'
    | 'DENSEST_ENEMY_CLUSTER'
    | 'FRONT_CONE'
    | 'FRONT_LINE'
    | 'AROUND_SELF'
    | 'LOWEST_HP_ALLY'
    | 'ALL_ALLIES'
    | 'TEAM_CENTER';

/**
 * Runtime 行为只描述“怎么结算”，具体数值全部留在 Catalog。
 * 新职业优先复用这些通用行为，不再新建一套 SkillManager。
 */
export type ProfessionSkillBehavior =
    | 'passive'
    | 'single_damage'
    | 'multi_hit'
    | 'area_damage'
    | 'line_damage'
    | 'cone_damage'
    | 'multi_target_damage'
    | 'chain_damage'
    | 'self_shield'
    | 'single_heal'
    | 'single_shield'
    | 'team_shield'
    | 'team_buff'
    | 'sanctuary';

/**
 * Lv1~Lv5 每一级的可执行参数。
 * 字段保持通用，复杂的“觉醒”规则以后通过 specialTags 扩展，
 * 不把职业专属逻辑塞进 UI 或 CharacterController。
 */
export interface ProfessionSkillLevelTuning {
    description: string;

    damageRatio?: number;
    hitCount?: number;
    projectileCount?: number;
    chainCount?: number;
    chainFalloff?: number;

    range?: number;
    radius?: number;
    knockback?: number;

    healMaxHpRatio?: number;
    shieldMaxHpRatio?: number;
    secondaryAllyRatio?: number;

    attackBonus?: number;
    attackSpeedBonus?: number;
    moveSpeedBonus?: number;
    damageReduction?: number;

    burnDuration?: number;
    burnDpsRatio?: number;
    slowRatio?: number;
    stunDuration?: number;

    cooldown?: number;
    cooldownRefundRatio?: number;
    eliteBossDamageBonus?: number;
    defenseIgnoreRatio?: number;

    duration?: number;
    specialTags?: readonly string[];
}

export interface ProfessionSkillDefinition {
    id: string;
    professionId: ProfessionId;
    name: string;
    kind: ProfessionSkillKind;

    /** passive 固定 -1；四个主动技能固定 0~3。 */
    slotIndex: -1 | 0 | 1 | 2 | 3;

    targetMode: ProfessionSkillTargetMode;
    behavior: ProfessionSkillBehavior;

    /** 被动没有冷却；主动技能可以被 level tuning 覆盖。 */
    baseCooldown: number;

    icon: BattleArtKey;

    levels: readonly [
        ProfessionSkillLevelTuning,
        ProfessionSkillLevelTuning,
        ProfessionSkillLevelTuning,
        ProfessionSkillLevelTuning,
        ProfessionSkillLevelTuning,
    ];
}

export interface ProfessionSkillModule {
    professionId: ProfessionId;
    passive: ProfessionSkillDefinition;
    activeSkills: readonly [
        ProfessionSkillDefinition,
        ProfessionSkillDefinition,
        ProfessionSkillDefinition,
        ProfessionSkillDefinition,
    ];
}

export interface ProfessionSkillLevelSnapshot {
    professionId: ProfessionId;
    levels: Readonly<Record<string, number>>;
}
