import {
    ProfessionId,
} from '../../profession/definition/ProfessionTypes';

import {
    BattleArtKey,
} from '../../../ui/resources/BattleArt';

export type ActiveSkillEffectKind =
    | 'nearest_damage'
    | 'radius_damage'
    | 'self_shield'
    | 'self_heal';

export interface ActiveSkillDefinition {
    id: string;
    name: string;
    description: string;
    cooldown: number;
    energyCost: number;
    effectKind: ActiveSkillEffectKind;
    powerRatio: number;
    radius: number;
    knockback?: number;
    burnDuration?: number;
    burnDpsRatio?: number;
    icon: BattleArtKey;
}

export interface ActiveSkillLoadout {
    professionId: ProfessionId;
    skills: readonly [
        ActiveSkillDefinition,
        ActiveSkillDefinition,
        ActiveSkillDefinition,
        ActiveSkillDefinition,
    ];
}

const ICONS:
    readonly [
        BattleArtKey,
        BattleArtKey,
        BattleArtKey,
        BattleArtKey,
    ] = [
        'skill-flame-bolt',
        'skill-flame-ring',
        'skill-crimson-guard',
        'skill-meteor',
    ];

const FLAME_LOADOUT:
    ActiveSkillLoadout = {
        professionId: 'flame_caster',
        skills: [
            {
                id: 'flame_bolt',
                name: '炎弹',
                description: '攻击最近目标并引燃。',
                cooldown: 5,
                energyCost: 8,
                effectKind: 'nearest_damage',
                powerRatio: 2.1,
                radius: 420,
                burnDuration: 3,
                burnDpsRatio: 0.35,
                icon: ICONS[0],
            },
            {
                id: 'flame_ring',
                name: '烈焰环',
                description: '周围爆发伤害并击退。',
                cooldown: 10,
                energyCost: 18,
                effectKind: 'radius_damage',
                powerRatio: 1.65,
                radius: 210,
                knockback: 90,
                burnDuration: 4,
                burnDpsRatio: 0.25,
                icon: ICONS[1],
            },
            {
                id: 'crimson_guard',
                name: '赤炎护体',
                description: '获得护盾并恢复少量生命。',
                cooldown: 16,
                energyCost: 22,
                effectKind: 'self_shield',
                powerRatio: 4.2,
                radius: 0,
                icon: ICONS[2],
            },
            {
                id: 'meteor',
                name: '天火陨星',
                description: '大范围终极爆发。',
                cooldown: 38,
                energyCost: 60,
                effectKind: 'radius_damage',
                powerRatio: 5.8,
                radius: 390,
                knockback: 130,
                burnDuration: 6,
                burnDpsRatio: 0.5,
                icon: ICONS[3],
            },
        ],
    };

function makeTemplate(
    professionId: ProfessionId,
    names: readonly [string, string, string, string],
    ratios: readonly [number, number, number, number],
    thirdKind: 'self_shield' | 'self_heal',
): ActiveSkillLoadout {
    return {
        professionId,
        skills: [
            {
                id: `${professionId}_skill_1`,
                name: names[0],
                description: '高频单体输出。',
                cooldown: 5,
                energyCost: 8,
                effectKind: 'nearest_damage',
                powerRatio: ratios[0],
                radius: 380,
                icon: ICONS[0],
            },
            {
                id: `${professionId}_skill_2`,
                name: names[1],
                description: '范围攻击与控制。',
                cooldown: 10,
                energyCost: 18,
                effectKind: 'radius_damage',
                powerRatio: ratios[1],
                radius: 210,
                knockback: 65,
                icon: ICONS[1],
            },
            {
                id: `${professionId}_skill_3`,
                name: names[2],
                description: '生存与续航。',
                cooldown: 16,
                energyCost: 22,
                effectKind: thirdKind,
                powerRatio: ratios[2],
                radius: 0,
                icon: ICONS[2],
            },
            {
                id: `${professionId}_skill_4`,
                name: names[3],
                description: '职业终极技能。',
                cooldown: 38,
                energyCost: 60,
                effectKind: 'radius_damage',
                powerRatio: ratios[3],
                radius: 360,
                knockback: 110,
                icon: ICONS[3],
            },
        ],
    };
}

export const ACTIVE_SKILL_CATALOG:
    readonly ActiveSkillLoadout[] = [
        FLAME_LOADOUT,
        makeTemplate(
            'sword_cultivator',
            ['飞剑斩', '剑气环', '御剑护身', '万剑归宗'],
            [2.35, 1.8, 4.5, 6.1],
            'self_shield',
        ),
        makeTemplate(
            'spirit_alchemist',
            ['灵药弹', '百草雾', '回春丹', '仙草领域'],
            [1.85, 1.45, 3.8, 4.8],
            'self_heal',
        ),
        makeTemplate(
            'body_cultivator',
            ['震地拳', '狮子吼', '金刚护体', '山河震'],
            [2.0, 1.7, 5.2, 5.4],
            'self_shield',
        ),
    ];

export function getActiveSkillLoadout(
    professionId: ProfessionId,
): ActiveSkillLoadout {
    return (
        ACTIVE_SKILL_CATALOG.find(
            (entry) =>
                entry.professionId ===
                professionId,
        ) ??
        FLAME_LOADOUT
    );
}
