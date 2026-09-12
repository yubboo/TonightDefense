/**
 * @architecture TonightDefense V1.0
 * @owner ui
 * @module panels/hero-select
 */
import {
    resources,
    SpriteFrame,
} from 'cc';

import {
    CharacterDefinition,
} from '../../../systems/character/data/CharacterCatalog';

export class HeroPortraitResolver {
    static async preload(
        characters:
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
                characters.map(
                    async (
                        character,
                    ) => {
                        const frame =
                            await this.resolve(
                                character,
                            );

                        return [
                            character.id,
                            frame,
                        ] as const;
                    },
                ),
            );

        return new Map(entries);
    }

    private static async resolve(
        character:
            CharacterDefinition,
    ):
        Promise<
            SpriteFrame | null
        > {
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
        path: string,
    ):
        Promise<
            SpriteFrame | null
        > {
        return new Promise(
            (resolve) => {
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
                            resolve(null);
                            return;
                        }

                        resolve(frame);
                    },
                );
            },
        );
    }
}
