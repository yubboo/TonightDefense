/**
 * @architecture TonightDefense V1.0
 * @owner ui
 * @module panels/recruit
 *
 * 招募三选一面板。
 *
 * 设计目标：
 * - 不显示“小关通过”
 * - 不显示“三选一·招募伙伴”
 * - 不显示“当前队伍”
 * - 屏幕只出现 3 个角色选择
 */
import {
    BlockInputEvents,
    Color,
    Graphics,
    Layers,
    Node,
    tween,
    UIOpacity,
    UITransform,
    Vec3,
} from 'cc';

import {
    CharacterDefinition,
} from '../../../systems/hero/character/data/CharacterCatalog';

import {
    CompanionPortraitResolver,
} from './CompanionPortraitResolver';

import {
    RecruitChoiceCard,
} from './RecruitChoiceCard';

export class RecruitChoicePanel {
    static async create(
        canvas: Node,
        companions:
            readonly CharacterDefinition[],
        onSelect:
            (
                companion:
                    CharacterDefinition,
            ) => void,
    ): Promise<Node> {
        /**
         * 先把可能存在的角色头像全部加载完。
         * 面板显示后不会再一张卡一张卡补人物。
         */
        const portraits =
            await CompanionPortraitResolver
                .preload(
                    companions,
                );

        const overlay =
            new Node(
                'RecruitChoiceOverlay',
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

        const bg =
            overlay.addComponent(
                Graphics,
            );

        /**
         * 背景压暗。
         */
        bg.fillColor =
            new Color(
                19,
                27,
                25,
                176,
            );

        bg.rect(
            -360,
            -640,
            720,
            1280,
        );

        bg.fill();

        /**
         * 中央奶油色底板。
         * 不放标题，只作为三个选项的承载。
         */
        bg.fillColor =
            new Color(
                255,
                249,
                229,
                252,
            );

        bg.roundRect(
            -344,
            -250,
            688,
            545,
            32,
        );

        bg.fill();

        bg.strokeColor =
            new Color(
                224,
                206,
                166,
                255,
            );

        bg.lineWidth = 4;

        bg.roundRect(
            -344,
            -250,
            688,
            545,
            32,
        );

        bg.stroke();

        /**
         * 上方很轻的皇冠装饰，
         * 没有文字，不占信息空间。
         */
        this.drawCrown(
            bg,
        );

        const xPositions =
            [
                -220,
                0,
                220,
            ];

        const cards:
            Node[] = [];

        for (
            let i = 0;
            i <
            companions.length &&
            i < 3;
            i += 1
        ) {
            const companion =
                companions[i];

            const card =
                RecruitChoiceCard
                    .create(
                        {
                            parent:
                                overlay,

                            companion,

                            portrait:
                                portraits.get(
                                    companion.id,
                                ) ??
                                null,

                            x:
                                xPositions[i],

                            y:
                                6,

                            onSelect,
                        },
                    );

            /**
             * 三张卡轻微错峰弹出。
             */
            card.setScale(
                0.9,
                0.9,
                1,
            );

            cards.push(card);
        }

        tween(opacity)
            .to(
                0.12,
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
                            0.045,
                    )
                    .to(
                        0.16,
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

    private static drawCrown(
        g: Graphics,
    ): void {
        g.fillColor =
            new Color(
                244,
                203,
                87,
                255,
            );

        g.moveTo(
            -43,
            284,
        );

        g.lineTo(
            -22,
            322,
        );

        g.lineTo(
            0,
            293,
        );

        g.lineTo(
            22,
            322,
        );

        g.lineTo(
            43,
            284,
        );

        g.lineTo(
            31,
            260,
        );

        g.lineTo(
            -31,
            260,
        );

        g.close();
        g.fill();

        g.fillColor =
            new Color(
                221,
                165,
                57,
                255,
            );

        g.moveTo(
            -8,
            287,
        );

        g.lineTo(
            0,
            300,
        );

        g.lineTo(
            8,
            287,
        );

        g.lineTo(
            0,
            274,
        );

        g.close();
        g.fill();
    }
}
