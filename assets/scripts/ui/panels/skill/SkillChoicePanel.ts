/**
 * @architecture TonightDefense V1.0
 * @owner ui
 * @module panels/skill
 *
 * 本局成长三选一面板。
 * 同时展示职业技能与全队属性候选；UI 不维护任何成长状态。
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
    HeroRunUpgradeOption,
} from '../../../systems/hero/progression/levelup/HeroRunUpgradeService';

import {
    SkillChoiceCard,
} from './SkillChoiceCard';

export class SkillChoicePanel {
    static async create(
        canvas: Node,
        options:
            readonly HeroRunUpgradeOption[],
        onSelect:
            (
                option: HeroRunUpgradeOption,
            ) => void,
    ): Promise<Node> {
        const overlay =
            new Node('SkillChoiceOverlay');

        overlay.layer =
            Layers.Enum.UI_2D;
        canvas.addChild(overlay);
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
                15,
                22,
                29,
                188,
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

        const xs =
            [-220, 0, 220];
        const cards: Node[] = [];

        for (
            let i = 0;
            i < options.length &&
            i < 3;
            i += 1
        ) {
            const card =
                SkillChoiceCard.create({
                    parent: overlay,
                    option: options[i],
                    x: xs[i],
                    y: 5,
                    onSelect,
                });

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
                { opacity: 255 },
                { easing: 'sineOut' },
            )
            .start();

        cards.forEach(
            (card, index) => {
                tween(card)
                    .delay(
                        index * 0.045,
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
                        { easing: 'backOut' },
                    )
                    .start();
            },
        );

        return overlay;
    }
}
