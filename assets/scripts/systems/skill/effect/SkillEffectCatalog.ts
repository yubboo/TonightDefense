export type SkillVisualEffectId =
    | 'fireball'
    | 'meteor_rain'
    | 'ice_nova'
    | 'lightning_chain'
    | 'dark_vortex'
    | 'whirlwind_slash'
    | 'shockwave'
    | 'arrow_rain'
    | 'piercing_strike'
    | 'flame_slash'
    | 'healing_aura'
    | 'shield'
    | 'speed_up'
    | 'poison'
    | 'stun'
    | 'level_up'
    | 'critical_hit'
    | 'kill'
    | 'portal'
    | 'death_dissolve';

export interface SkillVisualEffectDefinition {
    id: SkillVisualEffectId;
    name: string;
    resourcePath: string;
    category: 'magic' | 'physical' | 'status' | 'common';
}

export const SKILL_EFFECT_CATALOG:
    readonly SkillVisualEffectDefinition[] = [
        { id: 'fireball', name: '火球术', resourcePath: 'effects/skills/common/fireball', category: 'magic' },
        { id: 'meteor_rain', name: '陨石雨', resourcePath: 'effects/skills/common/meteor_rain', category: 'magic' },
        { id: 'ice_nova', name: '冰霜新星', resourcePath: 'effects/skills/common/ice_nova', category: 'magic' },
        { id: 'lightning_chain', name: '雷电链', resourcePath: 'effects/skills/common/lightning_chain', category: 'magic' },
        { id: 'dark_vortex', name: '黑暗漩涡', resourcePath: 'effects/skills/common/dark_vortex', category: 'magic' },
        { id: 'whirlwind_slash', name: '旋风斩', resourcePath: 'effects/skills/common/whirlwind_slash', category: 'physical' },
        { id: 'shockwave', name: '冲击波', resourcePath: 'effects/skills/common/shockwave', category: 'physical' },
        { id: 'arrow_rain', name: '箭雨', resourcePath: 'effects/skills/common/arrow_rain', category: 'physical' },
        { id: 'piercing_strike', name: '穿刺击', resourcePath: 'effects/skills/common/piercing_strike', category: 'physical' },
        { id: 'flame_slash', name: '烈焰斩', resourcePath: 'effects/skills/common/flame_slash', category: 'physical' },
        { id: 'healing_aura', name: '治疗光环', resourcePath: 'effects/skills/common/healing_aura', category: 'status' },
        { id: 'shield', name: '护盾', resourcePath: 'effects/skills/common/shield', category: 'status' },
        { id: 'speed_up', name: '加速', resourcePath: 'effects/skills/common/speed_up', category: 'status' },
        { id: 'poison', name: '中毒', resourcePath: 'effects/skills/common/poison', category: 'status' },
        { id: 'stun', name: '眩晕', resourcePath: 'effects/skills/common/stun', category: 'status' },
        { id: 'level_up', name: '升级特效', resourcePath: 'effects/common/level_up', category: 'common' },
        { id: 'critical_hit', name: '暴击特效', resourcePath: 'effects/common/critical_hit', category: 'common' },
        { id: 'kill', name: '击杀特效', resourcePath: 'effects/common/kill', category: 'common' },
        { id: 'portal', name: '传送门', resourcePath: 'effects/common/portal', category: 'common' },
        { id: 'death_dissolve', name: '死亡消散', resourcePath: 'effects/common/death_dissolve', category: 'common' },
    ];
