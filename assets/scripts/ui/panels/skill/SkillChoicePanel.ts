/**
 * @architecture TonightDefense V1.0
 * @owner ui
 * @module panels/skill
 *
 * 技能三选一面板。
 *
 * 与招募 UI 一样：
 * - 先把头像准备好
 * - 再一次性显示
 * - 不显示“小关通过”
 * - 不显示“当前队伍”
 * - 不放额外说明标题
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
    SkillChoiceOption,
} from '../../../systems/skill/runtime/SkillUpgradeService';

import {
    SkillTargetPortraitResolver,
} from './SkillTargetPortraitResolver';

import {
    SkillChoiceCard,
} from './SkillChoiceCard';

export class SkillChoicePanel {
    static async create(
        canvas: Node,
        options:
            readonly SkillChoiceOption[],
        onSelect:
            (
                option:
                    SkillChoiceOption,
            ) => void,
    ): Promise<Node> {
        const portraits =
            await SkillTargetPortraitResolver
                .preload(
                    options.map(
                        (
                            option,
                        ) =>
                            option.target,
                    ),
                );

        const overlay =
            new Node(
                'SkillChoiceOverlay',
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

        /**
         * 战斗背景压暗
         */
        g.fillColor =
            new Color(
                19,
                25,
                29,
                178,
            );

        g.rect(
            -360,
            -640,
            720,
            1280,
        );

        g.fill();

        /**
         * 中央底板
         */
        g.fillColor =
            new Color(
                255,
                249,
                230,
                252,
            );

        g.roundRect(
            -344,
            -258,
            688,
            558,
            32,
        );

        g.fill();

        g.strokeColor =
            new Color(
                224,
                206,
                166,
                255,
            );

        g.lineWidth = 4;

        g.roundRect(
            -344,
            -258,
            688,
            558,
            32,
        );

        g.stroke();

        /**
         * 顶部三颗小星，只做视觉提示，
         * 不增加文字占位。
         */
        this.drawStar(
            g,
            -42,
            279,
            10,
        );

        this.drawStar(
            g,
            0,
            292,
            14,
        );

        this.drawStar(
            g,
            42,
            279,
            10,
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
            options.length &&
            i < 3;
            i += 1
        ) {
            const option =
                options[i];

            const card =
                SkillChoiceCard
                    .create(
                        {
                            parent:
                                overlay,

                            option,

                            portrait:
                                portraits.get(
                                    option
                                        .target
                                        .id,
                                ) ??
                                null,

                            x:
                                xPositions[i],

                            y:
                                5,

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

    private static drawStar(
        g: Graphics,
        x: number,
        y: number,
        size: number,
    ): void {
        g.fillColor =
            new Color(
                241,
                199,
                83,
                255,
            );

        g.moveTo(
            x,
            y + size,
        );

        g.lineTo(
            x + size * 0.3,
            y + size * 0.3,
        );

        g.lineTo(
            x + size,
            y,
        );

        g.lineTo(
            x + size * 0.3,
            y - size * 0.3,
        );

        g.lineTo(
            x,
            y - size,
        );

        g.lineTo(
            x - size * 0.3,
            y - size * 0.3,
        );

        g.lineTo(
            x - size,
            y,
        );

        g.lineTo(
            x - size * 0.3,
            y + size * 0.3,
        );

        g.close();
        g.fill();
    }
}
