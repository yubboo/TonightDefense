/**
 * @architecture TonightDefense V1.0
 * @owner skill
 * @module definition
 *
 * 当前先做“可验证的属性强化技能”。
 * 后续火球、冰冻、范围爆炸等主动技能仍进入 SkillSystem。
 */
export type SkillEffectKind =
    | 'attack_percent'
    | 'defense_flat'
    | 'max_hp_percent'
    | 'move_speed_percent';

export interface SkillDefinition {
    id: string;
    name: string;
    description: string;
    effectKind: SkillEffectKind;
    value: number;

    /**
     * hero = 主角可选
     * companion = 伙伴可选
     * all = 都可选
     */
    target:
        'hero'
        | 'companion'
        | 'all';

    /**
     * 可选职业关键词。
     * 为空表示通用。
     */
    roleKeywords?: readonly string[];
}

export const SKILL_CATALOG:
    readonly SkillDefinition[] = [
        {
            id: 'power_training',
            name: '强攻训练',
            description:
                '攻击力提高 12%',
            effectKind:
                'attack_percent',
            value: 0.12,
            target: 'all',
        },

        {
            id: 'vitality_blessing',
            name: '生命祝福',
            description:
                '最大生命提高 15%，并同步恢复增加的生命',
            effectKind:
                'max_hp_percent',
            value: 0.15,
            target: 'all',
        },

        {
            id: 'armor_training',
            name: '护甲强化',
            description:
                '防御力 +2',
            effectKind:
                'defense_flat',
            value: 2,
            target: 'all',
        },

        {
            id: 'swift_steps',
            name: '迅捷步伐',
            description:
                '移动速度提高 6%',
            effectKind:
                'move_speed_percent',
            value: 0.06,
            target: 'all',
        },

        {
            id: 'arcane_focus',
            name: '奥术增幅',
            description:
                '法术型伙伴攻击力提高 16%',
            effectKind:
                'attack_percent',
            value: 0.16,
            target: 'companion',
            roleKeywords: [
                '法术',
                '范围',
                '控制',
            ],
        },

        {
            id: 'ranger_focus',
            name: '精准射击',
            description:
                '远程型伙伴攻击力提高 15%',
            effectKind:
                'attack_percent',
            value: 0.15,
            target: 'companion',
            roleKeywords: [
                '远程',
            ],
        },

        {
            id: 'frontline_guard',
            name: '前线守护',
            description:
                '前排伙伴最大生命提高 20%',
            effectKind:
                'max_hp_percent',
            value: 0.20,
            target: 'companion',
            roleKeywords: [
                '坦克',
                '战士',
                '半肉',
            ],
        },

        {
            id: 'hero_resolve',
            name: '守城意志',
            description:
                '主角攻击力提高 14%',
            effectKind:
                'attack_percent',
            value: 0.14,
            target: 'hero',
        },
    ] as const;
