import {
    ProfessionId,
} from '../../profession/definition/ProfessionTypes';

import {
    getProfessionSkillModule,
    getSkillLevelTuning,
} from '../data/ProfessionSkillCatalog';

import {
    ProfessionSkillDefinition,
} from '../data/ProfessionSkillTypes';

import {
    ProfessionSkillRunState,
} from '../runtime/ProfessionSkillRunState';

export interface ProfessionSkillRollSource {
    professionId: ProfessionId;
    professionName: string;
    weight: number;
    memberCount: number;
    includesMainHero: boolean;
}

export interface HeroSkillChoiceOption {
    professionId: ProfessionId;
    professionName: string;
    skill: ProfessionSkillDefinition;
    currentLevel: number;
    nextLevel: number;
    isUnlock: boolean;
    description: string;
}

interface WeightedCandidate {
    source: ProfessionSkillRollSource;
    skill: ProfessionSkillDefinition;
    weight: number;
}

/**
 * 单局职业技能三选一。
 *
 * 权重规则：
 * - 主角职业 +2；
 * - 每名 AI 英雄职业 +1；
 * - 同职业多人自动叠加；
 * - 满级技能排除；
 * - 同一轮同技能不重复。
 */
export class HeroSkillUpgradeService {
    static rollThreeOptions(
        sources:
            readonly ProfessionSkillRollSource[],
    ): HeroSkillChoiceOption[] {
        const candidates:
            WeightedCandidate[] = [];

        for (const source of sources) {
            ProfessionSkillRunState
                .ensureProfession(
                    source.professionId,
                );

            const upgradable =
                ProfessionSkillRunState
                    .getUpgradeableSkills(
                        source.professionId,
                    );
            const perSkillWeight =
                Math.max(
                    0.01,
                    source.weight /
                    Math.max(
                        1,
                        upgradable.length,
                    ),
                );

            for (const skill of upgradable) {
                candidates.push({
                    source,
                    skill,
                    weight:
                        perSkillWeight,
                });
            }
        }

        const pool =
            [...candidates];
        const result:
            HeroSkillChoiceOption[] = [];

        while (
            pool.length > 0 &&
            result.length < 3
        ) {
            const picked =
                this.pickWeighted(
                    pool,
                );

            if (!picked) {
                break;
            }

            const currentLevel =
                ProfessionSkillRunState
                    .getLevel(
                        picked
                            .source
                            .professionId,
                        picked.skill.id,
                    );
            const nextLevel =
                Math.min(
                    5,
                    currentLevel + 1,
                );

            result.push({
                professionId:
                    picked
                        .source
                        .professionId,
                professionName:
                    picked
                        .source
                        .professionName,
                skill:
                    picked.skill,
                currentLevel,
                nextLevel,
                isUnlock:
                    picked.skill.kind ===
                        'active' &&
                    currentLevel === 0,
                description:
                    getSkillLevelTuning(
                        picked.skill,
                        nextLevel,
                    ).description,
            });

            /** 同一轮不能重复出现同一技能。 */
            for (
                let i =
                    pool.length - 1;
                i >= 0;
                i -= 1
            ) {
                if (
                    pool[i].skill.id ===
                    picked.skill.id
                ) {
                    pool.splice(i, 1);
                }
            }
        }

        return result;
    }

    static apply(
        option: HeroSkillChoiceOption,
    ): boolean {
        const next =
            ProfessionSkillRunState
                .upgrade(
                    option.professionId,
                    option.skill.id,
                );

        return next !== null;
    }

    static getProfessionSummary(
        professionId: ProfessionId,
    ): {
        passiveLevel: number;
        unlockedActiveCount: number;
        moduleName: string;
    } {
        const module =
            getProfessionSkillModule(
                professionId,
            );

        let unlockedActiveCount = 0;

        for (
            const skill
            of module.activeSkills
        ) {
            if (
                ProfessionSkillRunState
                    .getLevel(
                        professionId,
                        skill.id,
                    ) > 0
            ) {
                unlockedActiveCount += 1;
            }
        }

        return {
            passiveLevel:
                ProfessionSkillRunState
                    .getLevel(
                        professionId,
                        module.passive.id,
                    ),
            unlockedActiveCount,
            moduleName:
                module.passive.name,
        };
    }

    private static pickWeighted(
        pool:
            readonly WeightedCandidate[],
    ): WeightedCandidate | null {
        let total = 0;

        for (const candidate of pool) {
            total +=
                Math.max(
                    0,
                    candidate.weight,
                );
        }

        if (total <= 0) {
            return pool[0] ?? null;
        }

        let roll =
            Math.random() * total;

        for (const candidate of pool) {
            roll -=
                Math.max(
                    0,
                    candidate.weight,
                );

            if (roll <= 0) {
                return candidate;
            }
        }

        return pool[
            pool.length - 1
        ] ?? null;
    }
}
