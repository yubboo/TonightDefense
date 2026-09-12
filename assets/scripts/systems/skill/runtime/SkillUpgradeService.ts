/**
 * @architecture TonightDefense V1.0
 * @owner skill
 * @module runtime
 */
import {
    SKILL_CATALOG,
    SkillDefinition,
} from '../definition/SkillCatalog';

import {
    MainHeroController,
} from '../../character/player/MainHeroController';

import {
    CompanionBattleController,
} from '../../character/companion/CompanionBattleController';

export interface SkillTargetInfo {
    id: string;
    name: string;

    kind:
        'hero'
        | 'companion';

    role?: string;
}

export interface SkillChoiceOption {
    target: SkillTargetInfo;
    skill: SkillDefinition;
}

export class SkillUpgradeService {
    static rollThreeOptions(
        targets:
            readonly SkillTargetInfo[],
    ): SkillChoiceOption[] {
        if (targets.length <= 0) {
            return [];
        }

        /**
         * 优先把三个卡位分配给不同角色。
         * 第3小关时通常正好是：
         * 主角 + 伙伴1 + 伙伴2。
         */
        const shuffledTargets =
            this.shuffle(
                [...targets],
            );

        const selectedTargets:
            SkillTargetInfo[] = [];

        for (
            let i = 0;
            i < 3;
            i += 1
        ) {
            selectedTargets.push(
                shuffledTargets[
                    i %
                    shuffledTargets.length
                ],
            );
        }

        return selectedTargets
            .map(
                (target) => ({
                    target,
                    skill:
                        this.pickSkillForTarget(
                            target,
                        ),
                }),
            );
    }

    static apply(
        option:
            SkillChoiceOption,
    ): boolean {
        if (
            option.target.kind ===
            'hero'
        ) {
            const combatant =
                MainHeroController
                    .instance
                    ?.combatant;

            if (!combatant) {
                return false;
            }

            combatant.applyUpgrade(
                option.skill
                    .effectKind,
                option.skill.value,
            );

            return true;
        }

        const combatant =
            CompanionBattleController
                .instance
                ?.getCombatantByCatalogId(
                    option.target.id,
                );

        if (!combatant) {
            return false;
        }

        combatant.applyUpgrade(
            option.skill.effectKind,
            option.skill.value,
        );

        return true;
    }

    private static pickSkillForTarget(
        target:
            SkillTargetInfo,
    ): SkillDefinition {
        const candidates =
            SKILL_CATALOG.filter(
                (skill) =>
                    this.matchesTarget(
                        skill,
                        target,
                    ),
            );

        const pool =
            candidates.length > 0
                ? candidates
                : SKILL_CATALOG;

        return pool[
            Math.floor(
                Math.random() *
                pool.length,
            )
        ];
    }

    private static matchesTarget(
        skill:
            SkillDefinition,
        target:
            SkillTargetInfo,
    ): boolean {
        if (
            skill.target !==
                'all' &&
            skill.target !==
                target.kind
        ) {
            return false;
        }

        if (
            !skill.roleKeywords ||
            skill.roleKeywords.length <=
                0
        ) {
            return true;
        }

        const role =
            target.role ?? '';

        return skill.roleKeywords.some(
            (keyword) =>
                role.includes(keyword),
        );
    }

    private static shuffle<T>(
        input: T[],
    ): T[] {
        for (
            let i =
                input.length - 1;
            i > 0;
            i -= 1
        ) {
            const j =
                Math.floor(
                    Math.random() *
                    (i + 1),
                );

            [
                input[i],
                input[j],
            ] = [
                input[j],
                input[i],
            ];
        }

        return input;
    }
}
