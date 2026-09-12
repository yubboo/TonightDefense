import {
    ProfessionId,
} from '../../profession/definition/ProfessionTypes';

import {
    getProfessionSkillModule,
} from '../data/ProfessionSkillCatalog';

import {
    PROFESSION_SKILL_MAX_LEVEL,
    ProfessionSkillDefinition,
    ProfessionSkillLevelSnapshot,
} from '../data/ProfessionSkillTypes';

/**
 * 单局职业技能等级的唯一状态源。
 *
 * - 被动：职业首次进入本局阵容时自动拥有 Lv.1。
 * - 主动：默认 Lv.0（未解锁），三选一首次抽到升为 Lv.1。
 * - 所有技能最高 Lv.5。
 * - 同职业多名英雄共享该职业本局技能等级，但各自拥有独立冷却。
 */
export class ProfessionSkillRunState {
    private static readonly levels =
        new Map<
            ProfessionId,
            Map<string, number>
        >();

    static beginNewRun(): void {
        this.levels.clear();
    }

    static ensureProfession(
        professionId: ProfessionId,
    ): void {
        if (
            this.levels.has(
                professionId,
            )
        ) {
            return;
        }

        const module =
            getProfessionSkillModule(
                professionId,
            );

        const map =
            new Map<string, number>();

        map.set(
            module.passive.id,
            1,
        );

        for (
            const skill
            of module.activeSkills
        ) {
            map.set(
                skill.id,
                0,
            );
        }

        this.levels.set(
            professionId,
            map,
        );
    }

    static getLevel(
        professionId: ProfessionId,
        skillId: string,
    ): number {
        this.ensureProfession(
            professionId,
        );

        return (
            this.levels
                .get(professionId)
                ?.get(skillId) ??
            0
        );
    }

    static canUpgrade(
        professionId: ProfessionId,
        skillId: string,
    ): boolean {
        return (
            this.getLevel(
                professionId,
                skillId,
            ) <
            PROFESSION_SKILL_MAX_LEVEL
        );
    }

    static upgrade(
        professionId: ProfessionId,
        skillId: string,
    ): number | null {
        this.ensureProfession(
            professionId,
        );

        const module =
            getProfessionSkillModule(
                professionId,
            );

        const exists =
            module.passive.id ===
                skillId ||
            module.activeSkills.some(
                (skill) =>
                    skill.id ===
                    skillId,
            );

        if (!exists) {
            return null;
        }

        const current =
            this.getLevel(
                professionId,
                skillId,
            );

        if (
            current >=
            PROFESSION_SKILL_MAX_LEVEL
        ) {
            return null;
        }

        const next =
            current + 1;

        this.levels
            .get(professionId)!
            .set(
                skillId,
                next,
            );

        return next;
    }

    static getUpgradeableSkills(
        professionId: ProfessionId,
    ): ProfessionSkillDefinition[] {
        this.ensureProfession(
            professionId,
        );

        const module =
            getProfessionSkillModule(
                professionId,
            );

        return [
            module.passive,
            ...module.activeSkills,
        ].filter(
            (skill) =>
                this.canUpgrade(
                    professionId,
                    skill.id,
                ),
        );
    }

    static getSnapshot(
        professionId: ProfessionId,
    ): ProfessionSkillLevelSnapshot {
        this.ensureProfession(
            professionId,
        );

        const entries =
            this.levels.get(
                professionId,
            )!;

        const levels:
            Record<string, number> = {};

        for (
            const [id, level]
            of entries
        ) {
            levels[id] = level;
        }

        return {
            professionId,
            levels,
        };
    }
}
