/**
 * @architecture TonightDefense V1.0
 * @owner character
 * @module visual
 *
 * 主角战斗模型统一工厂。
 *
 * 目标：
 * 1. 选择什么人物，战场就创建对应人物视觉。
 * 2. 资源没准备好时也绝不能只剩一根血条。
 * 3. 元素法师直接复用现有 Cocos 拆件模型。
 * 4. 普通人物先显示职业化保底模型，再尝试正式 Sprite。
 */
import {
    Color,
    Graphics,
    Layers,
    Node,
    resources,
    Sprite,
    SpriteFrame,
    UIOpacity,
    UITransform,
    Vec2,
} from 'cc';

import {
    CharacterDefinition,
} from '../data/CharacterCatalog';

import {
    ProfessionDefinition,
} from '../../profession/definition/ProfessionTypes';

import {
    CutoutCharacterAnimator,
} from '../animation/CutoutCharacterAnimator';

export interface HeroBattleVisualHandle {
    root: Node;

    setMoveDirection(
        direction: Vec2,
    ): void;

    playAttack(): void;
}

export class HeroBattleVisualFactory {
    static async build(
        parent: Node,
        character:
            CharacterDefinition,
        profession:
            ProfessionDefinition,
    ):
        Promise<
            HeroBattleVisualHandle
        > {
        const root =
            new Node(
                'HeroBattleVisual',
            );

        root.layer =
            Layers.Enum.UI_2D;

        parent.addChild(root);

        root.addComponent(
            UITransform,
        ).setContentSize(
            100,
            116,
        );

        /**
         * 永久存在的保底视觉。
         * 即使资源加载失败，也不会出现“只有血条、人物全空白”。
         */
        const fallback =
            new Node(
                'FallbackVisual',
            );

        fallback.layer =
            Layers.Enum.UI_2D;

        root.addChild(
            fallback,
        );

        fallback.addComponent(
            UITransform,
        ).setContentSize(
            96,
            112,
        );

        this.drawFallback(
            fallback,
            character,
            profession,
        );

        /**
         * 元素法师优先使用已经完成的拆件动画模型。
         */
        if (
            character.id ===
            'mage'
        ) {
            const cutoutRoot =
                new Node(
                    'MageCutoutVisual',
                );

            cutoutRoot.layer =
                Layers.Enum.UI_2D;

            root.addChild(
                cutoutRoot,
            );

            cutoutRoot.addComponent(
                UITransform,
            ).setContentSize(
                110,
                130,
            );

            /**
             * 主角需要比伙伴版本略大一点。
             */
            cutoutRoot.setScale(
                1.34,
                1.34,
                1,
            );

            const animator =
                cutoutRoot.addComponent(
                    CutoutCharacterAnimator,
                );

            try {
                await animator.setupMage();

                /**
                 * 拆件完整建立成功后才隐藏保底视觉。
                 */
                fallback.active =
                    false;

                return {
                    root,

                    setMoveDirection:
                        (
                            direction,
                        ) => {
                            animator
                                .setMoveDirection(
                                    direction,
                                );
                        },

                    playAttack:
                        () => {
                            animator
                                .playAttack();
                        },
                };
            } catch (
                error
            ) {
                console.error(
                    '[今晚守城] 主角元素法师拆件模型创建失败，继续使用保底模型',
                    error,
                );

                if (
                    cutoutRoot.isValid
                ) {
                    cutoutRoot.destroy();
                }
            }
        }

        /**
         * 其它人物尝试正式正面 Sprite。
         * 加载失败时，fallback 始终保留。
         */
        const frame =
            await this.tryLoadCharacterFrame(
                character,
            );

        if (frame) {
            const spriteNode =
                new Node(
                    'CharacterSprite',
                );

            spriteNode.layer =
                Layers.Enum.UI_2D;

            root.addChild(
                spriteNode,
            );

            const transform =
                spriteNode.addComponent(
                    UITransform,
                );

            const sprite =
                spriteNode.addComponent(
                    Sprite,
                );

            sprite.spriteFrame =
                frame;

            sprite.sizeMode =
                Sprite.SizeMode.CUSTOM;

            const width =
                Math.max(
                    1,
                    frame.originalSize.width,
                );

            const height =
                Math.max(
                    1,
                    frame.originalSize.height,
                );

            const scale =
                Math.min(
                    90 / width,
                    108 / height,
                );

            transform.setContentSize(
                width * scale,
                height * scale,
            );

            /**
             * 不 destroy fallback。
             * 把它降成很淡的安全底层，避免某些异常 SpriteFrame
             * 导致人物彻底不可见。
             */
            const fallbackOpacity =
                fallback.addComponent(
                    UIOpacity,
                );

            fallbackOpacity.opacity =
                38;

            fallback.setScale(
                0.78,
                0.78,
                1,
            );

            let currentFacing = 1;

            return {
                root,

                setMoveDirection:
                    (
                        direction,
                    ) => {
                        if (
                            Math.abs(
                                direction.x,
                            ) <=
                            Math.abs(
                                direction.y,
                            ) ||
                            Math.abs(
                                direction.x,
                            ) <= 0.05
                        ) {
                            return;
                        }

                        const nextFacing =
                            direction.x < 0
                                ? -1
                                : 1;

                        if (
                            nextFacing ===
                            currentFacing
                        ) {
                            return;
                        }

                        currentFacing =
                            nextFacing;

                        spriteNode.setScale(
                            currentFacing,
                            1,
                            1,
                        );
                    },

                playAttack:
                    () => {},
            };
        }

        let currentFacing = 1;

        return {
            root,

            setMoveDirection:
                (
                    direction,
                ) => {
                    if (
                        Math.abs(
                            direction.x,
                        ) <=
                        Math.abs(
                            direction.y,
                        ) ||
                        Math.abs(
                            direction.x,
                        ) <= 0.05
                    ) {
                        return;
                    }

                    const nextFacing =
                        direction.x < 0
                            ? -1
                            : 1;

                    if (
                        nextFacing ===
                        currentFacing
                    ) {
                        return;
                    }

                    currentFacing =
                        nextFacing;

                    fallback.setScale(
                        currentFacing,
                        1,
                        1,
                    );
                },

            playAttack:
                () => {},
        };
    }

    private static async tryLoadCharacterFrame(
        character:
            CharacterDefinition,
    ):
        Promise<
            SpriteFrame | null
        > {
        const candidates = [
            `${character.resourceRoot}/sprite/${character.spriteKey}_down/spriteFrame`,
            `${character.resourceRoot}/icon/portrait/spriteFrame`,
        ];

        for (
            const path
            of candidates
        ) {
            const frame =
                await this.loadFrame(
                    path,
                );

            if (frame) {
                return frame;
            }
        }

        return null;
    }

    private static loadFrame(
        path: string,
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

                        resolve(frame);
                    },
                );
            },
        );
    }

    private static drawFallback(
        node: Node,
        character:
            CharacterDefinition,
        profession:
            ProfessionDefinition,
    ): void {
        const g =
            node.addComponent(
                Graphics,
            );

        const main =
            this.color(
                profession.theme.main,
            );

        const dark =
            this.color(
                profession.theme.dark,
            );

        g.fillColor =
            new Color(
                55,
                50,
                46,
                40,
            );

        g.ellipse(
            0,
            -44,
            34,
            9,
        );

        g.fill();

        g.strokeColor =
            main;

        g.lineWidth = 4;

        g.ellipse(
            0,
            -42,
            35,
            9,
        );

        g.stroke();

        g.fillColor =
            main;

        g.roundRect(
            -25,
            -30,
            50,
            61,
            16,
        );

        g.fill();

        g.fillColor =
            new Color(
                247,
                226,
                202,
                255,
            );

        g.circle(
            0,
            31,
            16,
        );

        g.fill();

        g.fillColor =
            new Color(
                53,
                47,
                53,
                255,
            );

        g.circle(
            -5,
            33,
            2,
        );

        g.circle(
            5,
            33,
            2,
        );

        g.fill();

        switch (
            profession.attackMode
        ) {
            case 'magic':
                g.fillColor =
                    dark;

                g.moveTo(
                    -27,
                    43,
                );

                g.lineTo(
                    0,
                    72,
                );

                g.lineTo(
                    25,
                    43,
                );

                g.close();
                g.fill();

                g.roundRect(
                    -30,
                    40,
                    60,
                    9,
                    4,
                );

                g.fill();

                g.strokeColor =
                    new Color(
                        92,
                        68,
                        48,
                        255,
                    );

                g.lineWidth = 5;

                g.moveTo(
                    30,
                    -29,
                );

                g.lineTo(
                    36,
                    45,
                );

                g.stroke();

                g.fillColor =
                    main;

                g.circle(
                    37,
                    52,
                    7,
                );

                g.fill();
                break;

            case 'ranged':
                g.fillColor =
                    dark;

                g.arc(
                    0,
                    33,
                    21,
                    0,
                    Math.PI,
                );

                g.lineTo(
                    -20,
                    17,
                );

                g.lineTo(
                    20,
                    17,
                );

                g.close();
                g.fill();

                g.strokeColor =
                    new Color(
                        119,
                        82,
                        49,
                        255,
                    );

                g.lineWidth = 3;

                g.arc(
                    30,
                    -1,
                    20,
                    -1.25,
                    1.25,
                );

                g.stroke();
                break;

            case 'support':
                g.strokeColor =
                    new Color(
                        242,
                        207,
                        89,
                        255,
                    );

                g.lineWidth = 3;

                g.ellipse(
                    0,
                    54,
                    20,
                    6,
                );

                g.stroke();

                g.strokeColor =
                    new Color(
                        94,
                        70,
                        50,
                        255,
                    );

                g.lineWidth = 4;

                g.moveTo(
                    29,
                    -31,
                );

                g.lineTo(
                    34,
                    44,
                );

                g.stroke();
                break;

            case 'melee':
            default:
                g.strokeColor =
                    new Color(
                        196,
                        204,
                        211,
                        255,
                    );

                g.lineWidth = 6;

                g.moveTo(
                    21,
                    -27,
                );

                g.lineTo(
                    38,
                    48,
                );

                g.stroke();

                g.strokeColor =
                    new Color(
                        95,
                        69,
                        48,
                        255,
                    );

                g.lineWidth = 4;

                g.moveTo(
                    16,
                    -5,
                );

                g.lineTo(
                    31,
                    -9,
                );

                g.stroke();
                break;
        }

        /**
         * 同职业也给不同人物一点差异，
         * 防止人物卡看起来完全是“同一个模板”。
         */
        const marker =
            this.hash(
                character.id,
            ) % 3;

        g.fillColor =
            new Color(
                245,
                194,
                79,
                255,
            );

        if (
            marker === 0
        ) {
            g.circle(
                0,
                57,
                4,
            );

            g.fill();
        } else if (
            marker === 1
        ) {
            g.moveTo(
                -6,
                57,
            );

            g.lineTo(
                0,
                65,
            );

            g.lineTo(
                6,
                57,
            );

            g.close();
            g.fill();
        } else {
            g.rect(
                -5,
                55,
                10,
                7,
            );

            g.fill();
        }
    }

    private static hash(
        value: string,
    ): number {
        let result = 0;

        for (
            let i = 0;
            i < value.length;
            i += 1
        ) {
            result =
                (
                    result * 31 +
                    value.charCodeAt(i)
                ) >>> 0;
        }

        return result;
    }

    private static color(
        value:
            readonly [
                number,
                number,
                number,
            ],
    ): Color {
        return new Color(
            value[0],
            value[1],
            value[2],
            255,
        );
    }
}
