/**
 * @architecture TonightDefense V1.0
 * @owner progression
 * @module levelup
 *
 * 本局“非技能属性强化”的唯一状态源。
 *
 * 规则：
 * - 基础职业/装备决定开局属性；
 * - 战斗开始后，攻击、防御、生命、移速、闪避等永久到本局结束的成长，
 *   只能从三选一进入这里；
 * - 新招募英雄会补齐本局已经获得的全队属性强化；
 * - 技能临时 Buff 仍走 CharacterCombatant Modifier，不复制到这里。
 */
import {
    CharacterCombatant,
} from '../../character/stats/CharacterCombatant';

export type HeroRunStatId =
    | 'attack'
    | 'defense'
    | 'max_hp'
    | 'move_speed'
    | 'dodge';

export interface HeroRunStatDefinition {
    id: HeroRunStatId;
    name: string;
    glyph: string;
    maxLevel: number;
    descriptionPerLevel: string;
    upgradeKind:
        Parameters<CharacterCombatant['applyUpgrade']>[0];
    value: number;
}

export const HERO_RUN_STAT_DEFINITIONS:
    readonly HeroRunStatDefinition[] = [
        {
            id: 'attack',
            name: '强攻',
            glyph: '攻',
            maxLevel: 5,
            descriptionPerLevel:
                '全队攻击力提高 10%。',
            upgradeKind:
                'attack_percent',
            value: 0.10,
        },
        {
            id: 'defense',
            name: '坚甲',
            glyph: '甲',
            maxLevel: 5,
            descriptionPerLevel:
                '全队防御力提高 2 点。',
            upgradeKind:
                'defense_flat',
            value: 2,
        },
        {
            id: 'max_hp',
            name: '体魄',
            glyph: '体',
            maxLevel: 5,
            descriptionPerLevel:
                '全队最大生命提高 10%。',
            upgradeKind:
                'max_hp_percent',
            value: 0.10,
        },
        {
            id: 'move_speed',
            name: '疾行',
            glyph: '速',
            maxLevel: 5,
            descriptionPerLevel:
                '全队移动速度提高 6%。',
            upgradeKind:
                'move_speed_percent',
            value: 0.06,
        },
        {
            id: 'dodge',
            name: '灵巧',
            glyph: '闪',
            maxLevel: 5,
            descriptionPerLevel:
                '全队闪避率提高 3%。',
            upgradeKind:
                'dodge_flat',
            value: 0.03,
        },
    ];

export class HeroRunStatState {
    private static readonly levels =
        new Map<HeroRunStatId, number>();

    static beginNewRun(): void {
        this.levels.clear();
    }

    static getLevel(
        id: HeroRunStatId,
    ): number {
        return this.levels.get(id) ?? 0;
    }

    static canUpgrade(
        definition:
            HeroRunStatDefinition,
    ): boolean {
        return (
            this.getLevel(
                definition.id,
            ) <
            definition.maxLevel
        );
    }

    static getUpgradeableDefinitions():
        HeroRunStatDefinition[] {
        return HERO_RUN_STAT_DEFINITIONS
            .filter(
                (definition) =>
                    this.canUpgrade(
                        definition,
                    ),
            );
    }

    static upgrade(
        id: HeroRunStatId,
    ): number | null {
        const definition =
            HERO_RUN_STAT_DEFINITIONS
                .find(
                    (entry) =>
                        entry.id === id,
                );

        if (
            !definition ||
            !this.canUpgrade(
                definition,
            )
        ) {
            return null;
        }

        const next =
            this.getLevel(id) + 1;

        this.levels.set(
            id,
            next,
        );

        return next;
    }

    static applyIncrement(
        combatant:
            CharacterCombatant,
        definition:
            HeroRunStatDefinition,
    ): void {
        combatant.applyUpgrade(
            definition.upgradeKind,
            definition.value,
        );
    }

    /**
     * 新加入本局的英雄补齐已经选过的全队属性强化。
     * 只应在 CharacterCombatant.setup() 后调用一次。
     */
    static applySnapshot(
        combatant:
            CharacterCombatant,
    ): void {
        for (
            const definition
            of HERO_RUN_STAT_DEFINITIONS
        ) {
            const level =
                this.getLevel(
                    definition.id,
                );

            for (
                let i = 0;
                i < level;
                i += 1
            ) {
                this.applyIncrement(
                    combatant,
                    definition,
                );
            }
        }
    }
}
