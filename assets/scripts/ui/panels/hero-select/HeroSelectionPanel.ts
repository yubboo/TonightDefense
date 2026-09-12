/**
 * @architecture TonightDefense V1.0
 * @owner ui
 * @module panels/hero-select
 *
 * 开始游戏前的第一个三选一。
 */
import {
    BlockInputEvents,
    Color,
    Graphics,
    Label,
    Layers,
    Node,
    tween,
    UIOpacity,
    UITransform,
    Vec3,
} from 'cc';

import {
    CharacterDefinition,
} from '../../../systems/character/data/CharacterCatalog';

import {
    getProfessionById,
} from '../../../systems/profession/definition/ProfessionCatalog';

import {
    HeroPortraitResolver,
} from './HeroPortraitResolver';

import {
    HeroSelectionCard,
} from './HeroSelectionCard';

export class HeroSelectionPanel {
    static async create(
        canvas: Node,
        characters:
            readonly CharacterDefinition[],
        onSelect:
            (
                character:
                    CharacterDefinition,
            ) => void,
    ): Promise<Node> {
        const portraits =
            await HeroPortraitResolver
                .preload(
                    characters,
                );

        const overlay =
            new Node(
                'StarterHeroSelectionOverlay',
            );

        overlay.layer =
            Layers.Enum.UI_2D;

        canvas.addChild(
            overlay,
        );

        overlay.addComponent(
            UITransform,
        ).setContentSize(
            720,
            1280,
        );

        overlay.addComponent(
            BlockInputEvents,
        );

        const opacity =
            overlay.addComponent(
                UIOpacity,
            );

        opacity.opacity = 0;

        const g =
            overlay.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                16,
                24,
                23,
                205,
            );

        g.rect(
            -360,
            -640,
            720,
            1280,
        );

        g.fill();

        g.fillColor =
            new Color(
                255,
                248,
                228,
                253,
            );

        g.roundRect(
            -346,
            -254,
            692,
            590,
            34,
        );

        g.fill();

        g.strokeColor =
            new Color(
                224,
                204,
                160,
                255,
            );

        g.lineWidth = 4;

        g.roundRect(
            -346,
            -254,
            692,
            590,
            34,
        );

        g.stroke();

        const titleNode =
            new Node(
                'Title',
            );

        titleNode.layer =
            Layers.Enum.UI_2D;

        overlay.addChild(
            titleNode,
        );

        titleNode.setPosition(
            0,
            292,
            0,
        );

        titleNode.addComponent(
            UITransform,
        ).setContentSize(
            360,
            50,
        );

        const title =
            titleNode.addComponent(
                Label,
            );

        title.string =
            '选择你的主角';

        title.fontSize = 30;
        title.lineHeight = 36;

        title.color =
            new Color(
                61,
                52,
                42,
                255,
            );

        const xPositions = [
            -220,
            0,
            220,
        ];

        const cards:
            Node[] = [];

        for (
            let i = 0;
            i <
            characters.length &&
            i < 3;
            i += 1
        ) {
            const character =
                characters[i];

            const profession =
                getProfessionById(
                    character
                        .professionId,
                );

            const card =
                HeroSelectionCard
                    .create(
                        {
                            parent:
                                overlay,

                            character,

                            profession,

                            portrait:
                                portraits.get(
                                    character.id,
                                ) ??
                                null,

                            x:
                                xPositions[i],

                            y:
                                8,

                            onSelect,
                        },
                    );

            card.setScale(
                0.90,
                0.90,
                1,
            );

            cards.push(card);
        }

        tween(opacity)
            .to(
                0.14,
                {
                    opacity:
                        255,
                },
                {
                    easing:
                        'sineOut',
                },
            )
            .start();

        cards.forEach(
            (
                card,
                index,
            ) => {
                tween(card)
                    .delay(
                        index *
                            0.05,
                    )
                    .to(
                        0.18,
                        {
                            scale:
                                new Vec3(
                                    1,
                                    1,
                                    1,
                                ),
                        },
                        {
                            easing:
                                'backOut',
                        },
                    )
                    .start();
            },
        );

        return overlay;
    }
}
