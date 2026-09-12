/**
 * @architecture TonightDefense V1.0
 * @owner ui
 * @module panels/recruit
 *
 * 招募卡人物资源来自统一 CharacterCatalog。
 */
import {
    resources,
    SpriteFrame,
} from 'cc';

import {
    CharacterDefinition,
} from '../../../systems/hero/character/data/CharacterCatalog';

export class CompanionPortraitResolver {
    static async preload(
        companions:
            readonly CharacterDefinition[],
    ):
        Promise<
            Map<
                string,
                SpriteFrame | null
            >
        > {
        const entries =
            await Promise.all(
                companions.map(
                    async (
                        companion,
                    ) => {
                        const frame =
                            await this.resolve(
                                companion,
                            );

                        return [
                            companion.id,
                            frame,
                        ] as const;
                    },
                ),
            );

        return new Map(entries);
    }

    private static async resolve(
        companion:
            CharacterDefinition,
    ):
        Promise<
            SpriteFrame | null
        > {
        const root =
            companion.resourceRoot;

        const spriteKey =
            companion.spriteKey;

        const candidates = [
            `${root}/icon/portrait/spriteFrame`,
            `${root}/sprite/${spriteKey}_down/spriteFrame`,
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
