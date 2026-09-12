/**
 * @architecture TonightDefense V1.0
 * @owner ui
 * @module panels/hero-select
 *
 * 开局主角选择卡。
 *
 * 只显示：
 * - 人物
 * - 名字
 * - 职业
 * - 选择按钮
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
    CharacterDefinition,
} from '../../../systems/hero/character/data/CharacterCatalog';

import {
    ProfessionDefinition,
} from '../../../systems/hero/profession/definition/ProfessionTypes';

import {
    AudioManager,
} from '../../../systems/audio/AudioManager';

export interface HeroSelectionCardOptions {
    parent: Node;

    character:
        CharacterDefinition;

    profession:
        ProfessionDefinition;

    portrait:
        SpriteFrame | null;

    x: number;
    y: number;

    onSelect:
        (
            character:
                CharacterDefinition,
        ) => void;
}

export class HeroSelectionCard {
    static create(
        options:
            HeroSelectionCardOptions,
    ): Node {
        const {
            parent,
            character,
            profession,
            portrait,
            x,
            y,
            onSelect,
        } = options;

        const card =
            new Node(
                `HeroChoice_${character.id}`,
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
            202,
            426,
        );

        const g =
            card.addComponent(
                Graphics,
            );

        const main =
            this.color(
                profession
                    .theme
                    .main,
            );

        const soft =
            this.color(
                profession
                    .theme
                    .soft,
            );

        const dark =
            this.color(
                profession
                    .theme
                    .dark,
            );

        /**
         * 阴影
         */
        g.fillColor =
            new Color(
                34,
                31,
                28,
                45,
            );

        g.roundRect(
            -94,
            -205,
            198,
            410,
            25,
        );

        g.fill();

        /**
         * 卡片主体
         */
        g.fillColor =
            new Color(
                255,
                249,
                232,
                255,
            );

        g.roundRect(
            -100,
            -199,
            200,
            410,
            25,
        );

        g.fill();

        g.strokeColor =
            new Color(
                226,
                207,
                166,
                255,
            );

        g.lineWidth = 4;

        g.roundRect(
            -100,
            -199,
            200,
            410,
            25,
        );

        g.stroke();

        /**
         * 人物区
         */
        g.fillColor =
            soft;

        g.roundRect(
            -84,
            19,
            168,
            176,
            20,
        );

        g.fill();

        g.strokeColor =
            new Color(
                main.r,
                main.g,
                main.b,
                125,
            );

        g.lineWidth = 2;

        g.roundRect(
            -84,
            19,
            168,
            176,
            20,
        );

        g.stroke();

        /**
         * 顶部职业晶石
         */
        g.fillColor =
            new Color(
                255,
                249,
                229,
                255,
            );

        g.moveTo(
            0,
            210,
        );

        g.lineTo(
            19,
            190,
        );

        g.lineTo(
            0,
            170,
        );

        g.lineTo(
            -19,
            190,
        );

        g.close();
        g.fill();

        g.strokeColor =
            main;

        g.lineWidth = 4;

        g.moveTo(
            0,
            210,
        );

        g.lineTo(
            19,
            190,
        );

        g.lineTo(
            0,
            170,
        );

        g.lineTo(
            -19,
            190,
        );

        g.close();
        g.stroke();

        g.fillColor =
            main;

        g.circle(
            0,
            190,
            6,
        );

        g.fill();

        /**
         * 按钮
         */
        g.fillColor =
            new Color(
                229,
                225,
                210,
                255,
            );

        g.roundRect(
            -72,
            -177,
            144,
            50,
            22,
        );

        g.fill();

        g.fillColor =
            main;

        g.roundRect(
            -68,
            -173,
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
                115,
            );

        g.lineWidth = 2;

        g.roundRect(
            -64,
            -169,
            128,
            34,
            16,
        );

        g.stroke();

        this.createPortrait(
            card,
            character,
            profession,
            portrait,
        );

        this.createLabel(
            card,
            'Name',
            character.name,
            0,
            -8,
            26,
            176,
            34,
            new Color(
                46,
                43,
                40,
                255,
            ),
        );

        const roleBg =
            new Node(
                'ProfessionBadge',
            );

        roleBg.layer =
            Layers.Enum.UI_2D;

        card.addChild(
            roleBg,
        );

        roleBg.setPosition(
            0,
            -58,
            0,
        );

        roleBg.addComponent(
            UITransform,
        ).setContentSize(
            150,
            40,
        );

        const rg =
            roleBg.addComponent(
                Graphics,
            );

        rg.fillColor =
            new Color(
                main.r,
                main.g,
                main.b,
                30,
            );

        rg.roundRect(
            -75,
            -18,
            150,
            36,
            18,
        );

        rg.fill();

        this.createLabel(
            roleBg,
            'Profession',
            `${profession.name} · ${profession.roleLabel}`,
            0,
            0,
            16,
            140,
            26,
            dark,
        );

        this.createLabel(
            card,
            'Choose',
            '选择',
            0,
            -152,
            22,
            110,
            30,
            new Color(
                255,
                255,
                247,
                255,
            ),
        );

        card.on(
            Node.EventType.TOUCH_END,
            () => {
                AudioManager.playUi();
                onSelect(
                    character,
                );
            },
        );

        return card;
    }

    private static createPortrait(
        card:
            Node,
        character:
            CharacterDefinition,
        profession:
            ProfessionDefinition,
        portrait:
            SpriteFrame | null,
    ): void {
        const holder =
            new Node(
                'CharacterPreview',
            );

        holder.layer =
            Layers.Enum.UI_2D;

        card.addChild(holder);

        holder.setPosition(
            0,
            104,
            0,
        );

        holder.addComponent(
            UITransform,
        ).setContentSize(
            150,
            152,
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

            const width =
                Math.max(
                    1,
                    portrait
                        .originalSize
                        .width,
                );

            const height =
                Math.max(
                    1,
                    portrait
                        .originalSize
                        .height,
                );

            const scale =
                Math.min(
                    140 / width,
                    150 / height,
                );

            transform.setContentSize(
                width * scale,
                height * scale,
            );

            return;
        }

        this.drawFallback(
            holder,
            character,
            profession,
        );
    }

    private static drawFallback(
        holder:
            Node,
        character:
            CharacterDefinition,
        profession:
            ProfessionDefinition,
    ): void {
        const g =
            holder.addComponent(
                Graphics,
            );

        const main =
            this.color(
                profession
                    .theme
                    .main,
            );

        const dark =
            this.color(
                profession
                    .theme
                    .dark,
            );

        /**
         * 影子
         */
        g.fillColor =
            new Color(
                58,
                52,
                46,
                36,
            );

        g.ellipse(
            0,
            -57,
            40,
            10,
        );

        g.fill();

        /**
         * 身体
         */
        g.fillColor =
            main;

        g.roundRect(
            -34,
            -48,
            68,
            79,
            21,
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
            37,
            27,
        );

        g.fill();

        g.fillColor =
            new Color(
                52,
                46,
                53,
                255,
            );

        g.circle(
            -8,
            40,
            3,
        );

        g.circle(
            8,
            40,
            3,
        );

        g.fill();

        switch (
            profession.attackMode
        ) {
            case 'magic':
                /**
                 * 法师帽 + 法杖
                 */
                g.fillColor =
                    dark;

                g.moveTo(
                    -44,
                    57,
                );

                g.lineTo(
                    0,
                    105,
                );

                g.lineTo(
                    34,
                    56,
                );

                g.close();
                g.fill();

                g.roundRect(
                    -48,
                    53,
                    96,
                    14,
                    7,
                );

                g.fill();

                g.strokeColor =
                    new Color(
                        91,
                        66,
                        48,
                        255,
                    );

                g.lineWidth = 6;

                g.moveTo(
                    43,
                    -46,
                );

                g.lineTo(
                    51,
                    62,
                );

                g.stroke();

                g.fillColor =
                    main;

                g.circle(
                    52,
                    72,
                    10,
                );

                g.fill();
                break;

            case 'ranged':
                /**
                 * 兜帽 + 弓
                 */
                g.fillColor =
                    dark;

                g.arc(
                    0,
                    40,
                    34,
                    0,
                    Math.PI,
                );

                g.lineTo(
                    -31,
                    13,
                );

                g.lineTo(
                    31,
                    13,
                );

                g.close();
                g.fill();

                g.strokeColor =
                    new Color(
                        121,
                        83,
                        49,
                        255,
                    );

                g.lineWidth = 4;

                g.arc(
                    47,
                    -4,
                    30,
                    -1.25,
                    1.25,
                );

                g.stroke();
                break;

            case 'support':
                /**
                 * 光环 + 杖
                 */
                g.strokeColor =
                    new Color(
                        244,
                        211,
                        94,
                        255,
                    );

                g.lineWidth = 4;

                g.ellipse(
                    0,
                    79,
                    28,
                    8,
                );

                g.stroke();

                g.strokeColor =
                    new Color(
                        96,
                        72,
                        51,
                        255,
                    );

                g.lineWidth = 5;

                g.moveTo(
                    44,
                    -47,
                );

                g.lineTo(
                    49,
                    58,
                );

                g.stroke();

                g.fillColor =
                    main;

                g.circle(
                    50,
                    67,
                    9,
                );

                g.fill();
                break;

            case 'melee':
            default:
                /**
                 * 近战武器
                 */
                g.strokeColor =
                    new Color(
                        190,
                        198,
                        205,
                        255,
                    );

                g.lineWidth = 7;

                g.moveTo(
                    29,
                    -45,
                );

                g.lineTo(
                    55,
                    48,
                );

                g.stroke();

                g.strokeColor =
                    new Color(
                        95,
                        70,
                        50,
                        255,
                    );

                g.lineWidth = 5;

                g.moveTo(
                    22,
                    -16,
                );

                g.lineTo(
                    44,
                    -22,
                );

                g.stroke();
                break;
        }

        /**
         * 不显示描述，但用一个小额头标识区分同职业人物。
         */
        if (
            character.id ===
            'wild_body_cultivator'
        ) {
            g.fillColor =
                new Color(
                    245,
                    191,
                    75,
                    255,
                );

            g.circle(
                0,
                64,
                5,
            );

            g.fill();
        }
    }

    private static createLabel(
        parent:
            Node,
        name:
            string,
        text:
            string,
        x:
            number,
        y:
            number,
        fontSize:
            number,
        width:
            number,
        height:
            number,
        color:
            Color,
    ): Label {
        const node =
            new Node(name);

        node.layer =
            Layers.Enum.UI_2D;

        parent.addChild(node);

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
            fontSize + 5;
        label.color = color;

        label.overflow =
            Label.Overflow.SHRINK;

        return label;
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
