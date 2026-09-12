/**
 * @architecture TonightDefense V1.0
 * @owner ui
 * @module panels/skill
 *
 * 技能强化卡。
 *
 * 一张卡表达两件事：
 * 1. 这张强化给谁
 * 2. 具体强化什么
 */
import {
    Color,
    Graphics,
    Label,
    Layers,
    Node,
    Sprite,
    SpriteFrame,
    UITransform,
} from 'cc';

import {
    SkillChoiceOption,
} from '../../../systems/skill/runtime/SkillUpgradeService';

import {
    SkillEffectKind,
} from '../../../systems/skill/definition/SkillCatalog';

import {
    AudioManager,
} from '../../../systems/audio/AudioManager';

export interface SkillChoiceCardOptions {
    parent: Node;
    option:
        SkillChoiceOption;
    portrait:
        SpriteFrame | null;
    x: number;
    y: number;
    onSelect:
        (
            option:
                SkillChoiceOption,
        ) => void;
}

interface SkillPalette {
    main: Color;
    soft: Color;
    dark: Color;
}

export class SkillChoiceCard {
    static create(
        options:
            SkillChoiceCardOptions,
    ): Node {
        const {
            parent,
            option,
            portrait,
            x,
            y,
            onSelect,
        } = options;

        const palette =
            this.getSkillPalette(
                option.skill
                    .effectKind,
            );

        const card =
            new Node(
                `SkillCard_${option.target.id}_${option.skill.id}`,
            );

        card.layer =
            Layers.Enum.UI_2D;

        parent.addChild(card);

        card.setPosition(
            x,
            y,
            0,
        );

        card.addComponent(
            UITransform,
        ).setContentSize(
            196,
            432,
        );

        const graphics =
            card.addComponent(
                Graphics,
            );

        this.drawShell(
            graphics,
            palette,
        );

        this.createPortrait(
            card,
            option,
            portrait,
            palette,
        );

        this.createTargetName(
            card,
            option.target.name,
        );

        this.createRoleText(
            card,
            option.target.role ??
                (
                    option.target.kind ===
                        'hero'
                        ? '主角'
                        : '伙伴'
                ),
        );

        this.createSkillIcon(
            card,
            option.skill
                .effectKind,
            palette,
        );

        this.createSkillName(
            card,
            option.skill.name,
        );

        this.createDescription(
            card,
            option.skill.description,
            palette,
        );

        this.createActionText(
            card,
        );

        card.on(
            Node.EventType.TOUCH_END,
            () => {
                AudioManager.playUi();
                onSelect(option);
            },
        );

        return card;
    }

    private static drawShell(
        g: Graphics,
        palette:
            SkillPalette,
    ): void {
        /**
         * 轻阴影
         */
        g.fillColor =
            new Color(
                43,
                39,
                35,
                42,
            );

        g.roundRect(
            -92,
            -211,
            192,
            421,
            25,
        );

        g.fill();

        /**
         * 卡体
         */
        g.fillColor =
            new Color(
                255,
                250,
                236,
                255,
            );

        g.roundRect(
            -97,
            -205,
            194,
            418,
            25,
        );

        g.fill();

        g.strokeColor =
            new Color(
                225,
                209,
                174,
                255,
            );

        g.lineWidth = 4;

        g.roundRect(
            -97,
            -205,
            194,
            418,
            25,
        );

        g.stroke();

        /**
         * 人物展示背景
         */
        g.fillColor =
            palette.soft;

        g.roundRect(
            -82,
            50,
            164,
            143,
            18,
        );

        g.fill();

        /**
         * 技能区浅底
         */
        g.fillColor =
            new Color(
                palette.main.r,
                palette.main.g,
                palette.main.b,
                21,
            );

        g.roundRect(
            -78,
            -111,
            156,
            102,
            18,
        );

        g.fill();

        /**
         * 技能按钮底
         */
        g.fillColor =
            new Color(
                226,
                223,
                208,
                255,
            );

        g.roundRect(
            -72,
            -183,
            144,
            50,
            22,
        );

        g.fill();

        g.fillColor =
            palette.main;

        g.roundRect(
            -68,
            -179,
            136,
            42,
            19,
        );

        g.fill();

        g.strokeColor =
            new Color(
                255,
                255,
                255,
                112,
            );

        g.lineWidth = 2;

        g.roundRect(
            -64,
            -175,
            128,
            34,
            16,
        );

        g.stroke();

        /**
         * 顶部小水晶装饰
         */
        g.fillColor =
            new Color(
                255,
                250,
                232,
                255,
            );

        g.moveTo(
            0,
            211,
        );

        g.lineTo(
            19,
            191,
        );

        g.lineTo(
            0,
            171,
        );

        g.lineTo(
            -19,
            191,
        );

        g.close();
        g.fill();

        g.strokeColor =
            palette.main;

        g.lineWidth = 4;

        g.moveTo(
            0,
            211,
        );

        g.lineTo(
            19,
            191,
        );

        g.lineTo(
            0,
            171,
        );

        g.lineTo(
            -19,
            191,
        );

        g.close();
        g.stroke();

        g.fillColor =
            palette.main;

        g.circle(
            0,
            191,
            6,
        );

        g.fill();
    }

    private static createPortrait(
        card: Node,
        option:
            SkillChoiceOption,
        portrait:
            SpriteFrame | null,
        palette:
            SkillPalette,
    ): void {
        const holder =
            new Node(
                'TargetPortrait',
            );

        holder.layer =
            Layers.Enum.UI_2D;

        card.addChild(
            holder,
        );

        holder.setPosition(
            0,
            120,
            0,
        );

        holder.addComponent(
            UITransform,
        ).setContentSize(
            148,
            126,
        );

        if (portrait) {
            const spriteNode =
                new Node(
                    'PortraitSprite',
                );

            spriteNode.layer =
                Layers.Enum.UI_2D;

            holder.addChild(
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
                portrait;

            sprite.sizeMode =
                Sprite.SizeMode.CUSTOM;

            const sourceWidth =
                Math.max(
                    1,
                    portrait
                        .originalSize
                        .width,
                );

            const sourceHeight =
                Math.max(
                    1,
                    portrait
                        .originalSize
                        .height,
                );

            const scale =
                Math.min(
                    132 /
                        sourceWidth,
                    122 /
                        sourceHeight,
                );

            transform.setContentSize(
                sourceWidth *
                    scale,
                sourceHeight *
                    scale,
            );

            return;
        }

        this.drawFallbackTarget(
            holder,
            option,
            palette,
        );
    }

    private static drawFallbackTarget(
        holder: Node,
        option:
            SkillChoiceOption,
        palette:
            SkillPalette,
    ): void {
        const g =
            holder.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                70,
                63,
                55,
                35,
            );

        g.ellipse(
            0,
            -47,
            35,
            9,
        );

        g.fill();

        const isHero =
            option.target.kind ===
            'hero';

        /**
         * 身体
         */
        g.fillColor =
            isHero
                ? new Color(
                    66,
                    105,
                    176,
                    255,
                )
                : palette.main;

        g.roundRect(
            -29,
            -38,
            58,
            66,
            18,
        );

        g.fill();

        /**
         * 脸
         */
        g.fillColor =
            new Color(
                247,
                226,
                202,
                255,
            );

        g.circle(
            0,
            28,
            23,
        );

        g.fill();

        g.fillColor =
            new Color(
                58,
                51,
                57,
                255,
            );

        g.circle(
            -7,
            31,
            2.6,
        );

        g.circle(
            7,
            31,
            2.6,
        );

        g.fill();

        if (isHero) {
            /**
             * 主角尖帽 + 法杖占位
             */
            g.fillColor =
                new Color(
                    236,
                    186,
                    59,
                    255,
                );

            g.moveTo(
                -22,
                45,
            );

            g.lineTo(
                0,
                77,
            );

            g.lineTo(
                22,
                45,
            );

            g.close();
            g.fill();

            g.strokeColor =
                new Color(
                    91,
                    68,
                    48,
                    255,
                );

            g.lineWidth = 5;

            g.moveTo(
                31,
                -35,
            );

            g.lineTo(
                38,
                47,
            );

            g.stroke();

            g.fillColor =
                new Color(
                    77,
                    214,
                    235,
                    255,
                );

            g.circle(
                39,
                54,
                7,
            );

            g.fill();

            return;
        }

        const role =
            option.target.role ?? '';

        if (
            role.includes(
                '法术',
            ) ||
            role.includes(
                '控制',
            )
        ) {
            g.fillColor =
                new Color(
                    67,
                    49,
                    96,
                    255,
                );

            g.moveTo(
                -38,
                46,
            );

            g.lineTo(
                0,
                84,
            );

            g.lineTo(
                31,
                44,
            );

            g.close();

            g.fill();

            g.roundRect(
                -41,
                43,
                82,
                12,
                6,
            );

            g.fill();

            return;
        }

        if (
            role.includes(
                '远程',
            )
        ) {
            g.fillColor =
                new Color(
                    59,
                    111,
                    71,
                    255,
                );

            g.arc(
                0,
                31,
                28,
                0,
                Math.PI,
            );

            g.lineTo(
                -26,
                9,
            );

            g.lineTo(
                26,
                9,
            );

            g.close();
            g.fill();

            return;
        }

        if (
            role.includes(
                '坦克',
            ) ||
            role.includes(
                '半肉',
            )
        ) {
            g.fillColor =
                new Color(
                    215,
                    221,
                    226,
                    255,
                );

            g.roundRect(
                -27,
                11,
                54,
                41,
                15,
            );

            g.fill();

            g.fillColor =
                new Color(
                    58,
                    83,
                    121,
                    255,
                );

            g.rect(
                -21,
                31,
                42,
                6,
            );

            g.fill();

            return;
        }

        /**
         * 通用伙伴头饰
         */
        g.fillColor =
            palette.dark;

        g.moveTo(
            -19,
            45,
        );

        g.lineTo(
            -8,
            61,
        );

        g.lineTo(
            0,
            48,
        );

        g.lineTo(
            8,
            61,
        );

        g.lineTo(
            19,
            45,
        );

        g.close();
        g.fill();
    }

    private static createTargetName(
        card: Node,
        name: string,
    ): void {
        this.createLabel(
            card,
            'TargetName',
            name,
            0,
            36,
            21,
            160,
            30,
            new Color(
                47,
                44,
                41,
                255,
            ),
        );
    }

    private static createRoleText(
        card: Node,
        role: string,
    ): void {
        this.createLabel(
            card,
            'TargetRole',
            role,
            0,
            11,
            14,
            154,
            23,
            new Color(
                112,
                101,
                83,
                255,
            ),
        );
    }

    private static createSkillIcon(
        card: Node,
        effectKind:
            SkillEffectKind,
        palette:
            SkillPalette,
    ): void {
        const icon =
            new Node(
                'SkillIcon',
            );

        icon.layer =
            Layers.Enum.UI_2D;

        card.addChild(icon);

        icon.setPosition(
            -48,
            -46,
            0,
        );

        icon.addComponent(
            UITransform,
        ).setContentSize(
            44,
            44,
        );

        const g =
            icon.addComponent(
                Graphics,
            );

        g.fillColor =
            palette.main;

        g.circle(
            0,
            0,
            20,
        );

        g.fill();

        g.strokeColor =
            new Color(
                255,
                253,
                240,
                255,
            );

        g.fillColor =
            new Color(
                255,
                253,
                240,
                255,
            );

        g.lineWidth = 4;

        switch (effectKind) {
            case 'attack_percent':
                /**
                 * 闪电/剑刃感
                 */
                g.moveTo(
                    -4,
                    14,
                );

                g.lineTo(
                    7,
                    3,
                );

                g.lineTo(
                    1,
                    3,
                );

                g.lineTo(
                    6,
                    -13,
                );

                g.lineTo(
                    -8,
                    1,
                );

                g.lineTo(
                    -2,
                    1,
                );

                g.close();
                g.fill();
                break;

            case 'defense_flat':
                /**
                 * 盾
                 */
                g.moveTo(
                    0,
                    14,
                );

                g.lineTo(
                    12,
                    9,
                );

                g.lineTo(
                    10,
                    -5,
                );

                g.lineTo(
                    0,
                    -15,
                );

                g.lineTo(
                    -10,
                    -5,
                );

                g.lineTo(
                    -12,
                    9,
                );

                g.close();
                g.fill();
                break;

            case 'max_hp_percent':
                /**
                 * 心形简化
                 */
                g.circle(
                    -6,
                    5,
                    7,
                );

                g.circle(
                    6,
                    5,
                    7,
                );

                g.fill();

                g.moveTo(
                    -12,
                    4,
                );

                g.lineTo(
                    0,
                    -13,
                );

                g.lineTo(
                    12,
                    4,
                );

                g.close();
                g.fill();
                break;

            case 'move_speed_percent':
            default:
                /**
                 * 双箭头
                 */
                g.moveTo(
                    -12,
                    7,
                );

                g.lineTo(
                    2,
                    7,
                );

                g.lineTo(
                    2,
                    13,
                );

                g.lineTo(
                    13,
                    0,
                );

                g.lineTo(
                    2,
                    -13,
                );

                g.lineTo(
                    2,
                    -7,
                );

                g.lineTo(
                    -12,
                    -7,
                );

                g.close();
                g.fill();
                break;
        }
    }

    private static createSkillName(
        card: Node,
        name: string,
    ): void {
        this.createLabel(
            card,
            'SkillName',
            name,
            28,
            -40,
            20,
            98,
            28,
            new Color(
                50,
                47,
                43,
                255,
            ),
        );
    }

    private static createDescription(
        card: Node,
        description: string,
        palette:
            SkillPalette,
    ): void {
        this.createLabel(
            card,
            'Description',
            description,
            0,
            -87,
            15,
            142,
            36,
            palette.dark,
        );
    }

    private static createActionText(
        card: Node,
    ): void {
        this.createLabel(
            card,
            'ActionText',
            '强化',
            0,
            -158,
            22,
            112,
            30,
            new Color(
                255,
                255,
                245,
                255,
            ),
        );
    }

    private static createLabel(
        parent: Node,
        name: string,
        text: string,
        x: number,
        y: number,
        fontSize: number,
        width: number,
        height: number,
        color: Color,
    ): Label {
        const node =
            new Node(name);

        node.layer =
            Layers.Enum.UI_2D;

        parent.addChild(
            node,
        );

        node.setPosition(
            x,
            y,
            0,
        );

        node.addComponent(
            UITransform,
        ).setContentSize(
            width,
            height,
        );

        const label =
            node.addComponent(
                Label,
            );

        label.string = text;
        label.fontSize =
            fontSize;
        label.lineHeight =
            fontSize + 4;
        label.color = color;

        label.overflow =
            Label.Overflow.SHRINK;

        return label;
    }

    private static getSkillPalette(
        effectKind:
            SkillEffectKind,
    ): SkillPalette {
        switch (effectKind) {
            case 'attack_percent':
                return {
                    main:
                        new Color(
                            205,
                            103,
                            83,
                            255,
                        ),

                    soft:
                        new Color(
                            246,
                            219,
                            207,
                            255,
                        ),

                    dark:
                        new Color(
                            136,
                            63,
                            50,
                            255,
                        ),
                };

            case 'defense_flat':
                return {
                    main:
                        new Color(
                            84,
                            137,
                            198,
                            255,
                        ),

                    soft:
                        new Color(
                            215,
                            230,
                            246,
                            255,
                        ),

                    dark:
                        new Color(
                            51,
                            88,
                            137,
                            255,
                        ),
                };

            case 'max_hp_percent':
                return {
                    main:
                        new Color(
                            86,
                            169,
                            111,
                            255,
                        ),

                    soft:
                        new Color(
                            217,
                            239,
                            218,
                            255,
                        ),

                    dark:
                        new Color(
                            54,
                            113,
                            70,
                            255,
                        ),
                };

            case 'move_speed_percent':
            default:
                return {
                    main:
                        new Color(
                            132,
                            102,
                            201,
                            255,
                        ),

                    soft:
                        new Color(
                            229,
                            218,
                            248,
                            255,
                        ),

                    dark:
                        new Color(
                            85,
                            62,
                            138,
                            255,
                        ),
                };
        }
    }
}
