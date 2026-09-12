import {
    ProfessionId,
} from '../definition/ProfessionTypes';

export interface ProfessionPresentationDefinition {
    professionId: ProfessionId;
    uiGroup: 'warrior' | 'mage' | 'ranger' | 'support' | 'special';
    iconPath: string;
    effectRoot: string;
}

/**
 * 职业的“规则定义”仍在 ProfessionCatalog；
 * 这里仅管理表现资源路径，避免 UI/角色代码各自硬编码路径。
 */
const PRESENTATION:
    Partial<Record<ProfessionId, ProfessionPresentationDefinition>> = {
        element_mage: {
            professionId: 'element_mage',
            uiGroup: 'mage',
            iconPath: 'professions/element_mage/icon',
            effectRoot: 'effects/skills/hero/mage',
        },
        ranger: {
            professionId: 'ranger',
            uiGroup: 'ranger',
            iconPath: 'professions/ranger/icon',
            effectRoot: 'effects/skills/hero/ranger',
        },
        priest: {
            professionId: 'priest',
            uiGroup: 'support',
            iconPath: 'professions/priest/icon',
            effectRoot: 'effects/skills/hero/priest',
        },
        heavy_warrior: {
            professionId: 'heavy_warrior',
            uiGroup: 'warrior',
            iconPath: 'professions/heavy_warrior/icon',
            effectRoot: 'effects/skills/hero/warrior',
        },
        guardian_knight: {
            professionId: 'guardian_knight',
            uiGroup: 'warrior',
            iconPath: 'professions/guardian_knight/icon',
            effectRoot: 'effects/skills/companion/guardian',
        },
    };

export class ProfessionPresentationCatalog {
    static get(
        id: ProfessionId,
    ): ProfessionPresentationDefinition | undefined {
        return PRESENTATION[id];
    }
}
