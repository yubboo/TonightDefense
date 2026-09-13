/**
 * @architecture TonightDefense V1.0
 * @owner progression
 * @module levelup
 *
 * 本局“三选一”的统一候选入口。
 * 技能升级继续由 HeroSkillUpgradeService / ProfessionSkillRunState 持有；
 * 全队基础属性升级由 HeroRunStatState 持有。
 * 这里只负责把两类候选混合成同一个三选一并应用选择。
 */
import {
    MainHeroController,
} from '../../character/player/MainHeroController';

import {
    CompanionBattleController,
} from '../../character/companion/CompanionBattleController';

import {
    HeroSkillChoiceOption,
    HeroSkillUpgradeService,
    ProfessionSkillRollSource,
} from '../../skill/upgrade/HeroSkillUpgradeService';

import {
    HeroRunStatDefinition,
    HeroRunStatState,
} from './HeroRunStatState';

export interface HeroRunSkillChoiceOption {
    kind: 'skill';
    skillOption: HeroSkillChoiceOption;
}

export interface HeroRunStatChoiceOption {
    kind: 'stat';
    stat: HeroRunStatDefinition;
    currentLevel: number;
    nextLevel: number;
    description: string;
}

export type HeroRunUpgradeOption =
    | HeroRunSkillChoiceOption
    | HeroRunStatChoiceOption;

export class HeroRunUpgradeService {
    static rollThreeOptions(
        sources:
            readonly ProfessionSkillRollSource[],
    ): HeroRunUpgradeOption[] {
        const skillOptions =
            HeroSkillUpgradeService
                .rollThreeOptions(
                    sources,
                );

        const statDefinitions =
            this.shuffle(
                HeroRunStatState
                    .getUpgradeableDefinitions(),
            );

        const result:
            HeroRunUpgradeOption[] = [];

        /**
         * 只要两种成长都还有候选，就保证三张卡至少各出现一张。
         * 这样不会因为技能池很大，导致属性成长永远抽不到；
         * 也不会因为属性池存在，把职业技能完全挤出三选一。
         */
        if (skillOptions[0]) {
            result.push({
                kind: 'skill',
                skillOption:
                    skillOptions[0],
            });
        }

        if (statDefinitions[0]) {
            result.push(
                this.toStatOption(
                    statDefinitions[0],
                ),
            );
        }

        const extras:
            HeroRunUpgradeOption[] = [
                ...skillOptions
                    .slice(1)
                    .map(
                        (skillOption) => ({
                            kind: 'skill' as const,
                            skillOption,
                        }),
                    ),
                ...statDefinitions
                    .slice(1)
                    .map(
                        (definition) =>
                            this.toStatOption(
                                definition,
                            ),
                    ),
            ];

        this.shuffleInPlace(
            extras,
        );

        while (
            result.length < 3 &&
            extras.length > 0
        ) {
            result.push(
                extras.shift()!,
            );
        }

        this.shuffleInPlace(
            result,
        );

        return result;
    }

    static apply(
        option:
            HeroRunUpgradeOption,
    ): boolean {
        if (option.kind === 'skill') {
            return HeroSkillUpgradeService
                .apply(
                    option.skillOption,
                );
        }

        const next =
            HeroRunStatState
                .upgrade(
                    option.stat.id,
                );

        if (next === null) {
            return false;
        }

        const mainCombatant =
            MainHeroController
                .instance
                ?.combatant;

        if (mainCombatant) {
            HeroRunStatState
                .applyIncrement(
                    mainCombatant,
                    option.stat,
                );
        }

        for (
            const actor
            of CompanionBattleController
                .instance
                ?.getBattleActors() ??
            []
        ) {
            HeroRunStatState
                .applyIncrement(
                    actor.combatant,
                    option.stat,
                );
        }

        return true;
    }

    private static toStatOption(
        stat:
            HeroRunStatDefinition,
    ): HeroRunStatChoiceOption {
        const currentLevel =
            HeroRunStatState
                .getLevel(
                    stat.id,
                );

        return {
            kind: 'stat',
            stat,
            currentLevel,
            nextLevel:
                currentLevel + 1,
            description:
                stat.descriptionPerLevel,
        };
    }

    private static shuffle<T>(
        values:
            readonly T[],
    ): T[] {
        const copy = [...values];
        this.shuffleInPlace(copy);
        return copy;
    }

    private static shuffleInPlace<T>(
        values: T[],
    ): void {
        for (
            let i =
                values.length - 1;
            i > 0;
            i -= 1
        ) {
            const j =
                Math.floor(
                    Math.random() *
                    (i + 1),
                );

            const temp = values[i];
            values[i] = values[j];
            values[j] = temp;
        }
    }
}
