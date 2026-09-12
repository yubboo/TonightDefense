/**
 * @architecture TonightDefense V1.0
 * @owner ui
 * @module panels/skill
 *
 * 技能卡强化对象头像来自统一 CharacterCatalog。
 */
import {
    resources,
    SpriteFrame,
} from 'cc';

import {
    SkillTargetInfo,
} from '../../../systems/skill/runtime/SkillUpgradeService';

import {
    getCharacterById,
} from '../../../systems/character/data/CharacterCatalog';

import {
    HeroSelectionState,
} from '../../../systems/character/selection/HeroSelectionState';

export class SkillTargetPortraitResolver {
    static async preload(
        targets:
            readonly SkillTargetInfo[],
    ):
        Promise<
            Map<
                string,
                SpriteFrame | null
            >
        > {
        const unique =
            new Map<
                string,
                SkillTargetInfo
            >();

        for (
            const target
            of targets
        ) {
            unique.set(
                target.id,
                target,
            );
        }

        const entries =
            await Promise.all(
                [...unique.values()]
                    .map(
                        async (
                            target,
                        ) => {
                            const frame =
                                await this.resolve(
                                    target,
                                );

                            return [
                                target.id,
                                frame,
                            ] as const;
                        },
                    ),
            );

        return new Map(
            entries,
        );
    }

    private static async resolve(
        target:
            SkillTargetInfo,
    ):
        Promise<
            SpriteFrame | null
        > {
        const character =
            target.kind ===
                'hero'
                ? HeroSelectionState
                    .current
                : getCharacterById(
                    target.id,
                );

        if (!character) {
            return null;
        }

        const candidates = [
            `${character.resourceRoot}/icon/portrait/spriteFrame`,
            `${character.resourceRoot}/sprite/${character.spriteKey}_down/spriteFrame`,
        ];

        for (
            const path
            of candidates
        ) {
            const frame =
                await this.tryLoad(
                    path,
                );

            if (frame) {
                return frame;
            }
        }

        return null;
    }

    private static tryLoad(
        path:
            string,
    ):
        Promise<
            SpriteFrame | null
        > {
        return new Promise(
            (
                resolve,
            ) => {
                resources.load(
                    path,
                    SpriteFrame,
                    (
                        error,
                        frame,
                    ) => {
                        if (
                            error ||
                            !frame
                        ) {
                            resolve(
                                null,
                            );

                            return;
                        }

                        resolve(
                            frame,
                        );
                    },
                );
            },
        );
    }
}
