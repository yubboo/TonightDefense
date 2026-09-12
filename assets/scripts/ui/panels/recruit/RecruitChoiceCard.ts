/**
 * @architecture TonightDefense V1.0
 * @owner ui
 * @module panels/recruit
 *
 * 单张招募卡。
 *
 * 只展示：
 * - 角色模型 / 头像
 * - 名字
 * - 职业
 * - 招募按钮
 *
 * 不展示长描述，不展示当前队伍，不展示“小关通过”等标题。
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
    AudioManager,
} from '../../../systems/audio/AudioManager';

import {
    getProfessionById,
} from '../../../systems/hero/profession/definition/ProfessionCatalog';

export interface RecruitChoiceCardOptions {
    parent: Node;
    companion:
        CharacterDefinition;
    portrait:
        SpriteFrame | null;
    x: number;
    y: number;
    onSelect:
        (
            companion:
                CharacterDefinition,
        ) => void;
}

interface RolePalette {
    main: Color;
    soft: Color;
    dark: Color;
}

export class RecruitChoiceCard {
    static create(
        options:
            RecruitChoiceCardOptions,
    ): Node {
        const {
            parent,
            companion,
            portrait,
            x,
            y,
            onSelect,
        } = options;

        const palette =
            this.getRolePalette(
                this.getRole(companion),
            );

        const card =
            new Node(
                `RecruitCard_${companion.id}`,
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
            420,
        );

        const g =
            card.addComponent(
                Graphics,
            );

        this.drawCardShell(
            g,
            palette,
        );

        this.createPortraitArea(
            card,
            companion,
            portrait,
            palette,
        );

        this.createName(
            card,
            companion.name,
        );

        this.createRole(
            card,
            this.getRole(companion),
            palette,
        );

        this.createRecruitButton(
            card,
            palette,
        );

        /**
         * 整张卡都可点击，
         * 对小游戏触屏操作更友好。
         */
        card.on(
            Node.EventType.TOUCH_END,
            () => {
                AudioManager.playUi();
                onSelect(
                    companion,
                );
            },
        );

        return card;
    }

    private static drawCardShell(
        g: Graphics,
        palette:
            RolePalette,
    ): void {
        /**
         * 外阴影
         */
        g.fillColor =
            new Color(
                56,
                49,
                42,
                42,
            );

        g.roundRect(
            -91,
            -204,
            190,
            406,
            24,
        );

        g.fill();

        /**
         * 卡片主体
         */
        g.fillColor =
            new Color(
                255,
                250,
                235,
                255,
            );

        g.roundRect(
            -96,
            -198,
            192,
            404,
            24,
        );

        g.fill();

        /**
         * 外描边
         */
        g.strokeColor =
            new Color(
                224,
                208,
                169,
                255,
            );

        g.lineWidth = 4;

        g.roundRect(
            -96,
            -198,
            192,
            404,
            24,
        );

        g.stroke();

        /**
         * 顶部角色区域背景
         */
        g.fillColor =
            palette.soft;

        g.roundRect(
            -82,
            8,
            164,
            176,
            19,
        );

        g.fill();

        /**
         * 角色区域内框
         */
        g.strokeColor =
            new Color(
                palette.main.r,
                palette.main.g,
                palette.main.b,
                125,
            );

        g.lineWidth = 2;

        g.roundRect(
            -82,
            8,
            164,
            176,
            19,
        );

        g.stroke();

        /**
         * 顶部菱形职业装饰。
         * 只是装饰，不加额外文字。
         */
        g.fillColor =
            new Color(
                255,
                249,
                228,
                255,
            );

        g.moveTo(
            0,
            198,
        );

        g.lineTo(
            18,
            180,
        );

        g.lineTo(
            0,
            162,
        );

        g.lineTo(
            -18,
            180,
        );

        g.close();
        g.fill();

        g.strokeColor =
            palette.main;

        g.lineWidth = 4;

        g.moveTo(
            0,
            198,
        );

        g.lineTo(
            18,
            180,
        );

        g.lineTo(
            0,
            162,
        );

        g.lineTo(
            -18,
            180,
        );

        g.close();
        g.stroke();

        g.fillColor =
            palette.main;

        g.circle(
            0,
            180,
            6,
        );

        g.fill();

        /**
         * 底部招募按钮底座。
         */
        g.fillColor =
            new Color(
                230,
                226,
                210,
                255,
            );

        g.roundRect(
            -73,
            -174,
            146,
            50,
            22,
        );

        g.fill();

        g.fillColor =
            palette.main;

        g.roundRect(
            -69,
            -170,
            138,
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
            -65,
            -166,
            130,
            34,
            16,
        );

        g.stroke();
    }

    private static createPortraitArea(
        card: Node,
        companion:
            CharacterDefinition,
        portrait:
            SpriteFrame | null,
        palette:
            RolePalette,
    ): void {
        const holder =
            new Node(
                'CharacterPreview',
            );

        holder.layer =
            Layers.Enum.UI_2D;

        card.addChild(
            holder,
        );

        holder.setPosition(
            0,
            91,
            0,
        );

        holder.addComponent(
            UITransform,
        ).setContentSize(
            150,
            150,
        );

        if (portrait) {
            this.createSpritePortrait(
                holder,
                portrait,
            );

            return;
        }

        this.drawFallbackCharacter(
            holder,
            companion,
            palette,
        );
    }

    private static createSpritePortrait(
        holder:
            Node,
        portrait:
            SpriteFrame,
    ): void {
        const spriteNode =
            new Node(
                'PortraitSprite',
            );

        spriteNode.layer =
            Layers.Enum.UI_2D;

        holder.addChild(
            spriteNode,
        );

        const sprite =
            spriteNode.addComponent(
                Sprite,
            );

        sprite.spriteFrame =
            portrait;

        sprite.sizeMode =
            Sprite.SizeMode.CUSTOM;

        const transform =
            spriteNode.getComponent(
                UITransform,
            ) ??
            spriteNode.addComponent(
                UITransform,
            );

        const sourceWidth =
            Math.max(
                1,
                portrait.originalSize
                    .width,
            );

        const sourceHeight =
            Math.max(
                1,
                portrait.originalSize
                    .height,
            );

        const maxWidth = 136;
        const maxHeight = 150;

        const scale =
            Math.min(
                maxWidth /
                    sourceWidth,
                maxHeight /
                    sourceHeight,
            );

        transform.setContentSize(
            sourceWidth *
                scale,
            sourceHeight *
                scale,
        );

        spriteNode.setPosition(
            0,
            -2,
            0,
        );
    }

    private static drawFallbackCharacter(
        holder:
            Node,
        companion:
            CharacterDefinition,
        palette:
            RolePalette,
    ): void {
        const g =
            holder.addComponent(
                Graphics,
            );

        /**
         * 地面影子
         */
        g.fillColor =
            new Color(
                69,
                61,
                54,
                38,
            );

        g.ellipse(
            0,
            -60,
            40,
            11,
        );

        g.fill();

        /**
         * 身体
         */
        g.fillColor =
            palette.main;

        g.roundRect(
            -34,
            -49,
            68,
            78,
            22,
        );

        g.fill();

        /**
         * 脸
         */
        g.fillColor =
            new Color(
                248,
                226,
                200,
                255,
            );

        g.circle(
            0,
            35,
            27,
        );

        g.fill();

        /**
         * 简单眼睛
         */
        g.fillColor =
            new Color(
                58,
                51,
                57,
                255,
            );

        g.circle(
            -8,
            38,
            3,
        );

        g.circle(
            8,
            38,
            3,
        );

        g.fill();

        const role =
            this.getRole(companion);

        if (
            role.includes(
                '法术',
            ) ||
            role.includes(
                '控制',
            )
        ) {
            this.drawMageDetails(
                g,
                palette,
            );

            return;
        }

        if (
            role.includes(
                '远程',
            )
        ) {
            this.drawRangerDetails(
                g,
                palette,
            );

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
            this.drawKnightDetails(
                g,
                palette,
            );

            return;
        }

        if (
            role.includes(
                '辅助',
            ) ||
            role.includes(
                '增益',
            )
        ) {
            this.drawSupportDetails(
                g,
                palette,
            );

            return;
        }

        this.drawWarriorDetails(
            g,
            palette,
        );
    }

    private static drawMageDetails(
        g: Graphics,
        palette:
            RolePalette,
    ): void {
        /**
         * 大帽子
         */
        g.fillColor =
            palette.dark;

        g.moveTo(
            -44,
            54,
        );

        g.lineTo(
            0,
            103,
        );

        g.lineTo(
            32,
            53,
        );

        g.close();
        g.fill();

        g.roundRect(
            -48,
            51,
            96,
            15,
            7,
        );

        g.fill();

        /**
         * 法杖
         */
        g.strokeColor =
            new Color(
                90,
                67,
                52,
                255,
            );

        g.lineWidth = 6;

        g.moveTo(
            42,
            -48,
        );

        g.lineTo(
            51,
            55,
        );

        g.stroke();

        g.fillColor =
            new Color(
                193,
                102,
                238,
                255,
            );

        g.circle(
            52,
            64,
            11,
        );

        g.fill();
    }

    private static drawRangerDetails(
        g: Graphics,
        palette:
            RolePalette,
    ): void {
        /**
         * 兜帽
         */
        g.fillColor =
            palette.dark;

        g.arc(
            0,
            37,
            34,
            0,
            Math.PI,
        );

        g.lineTo(
            -31,
            12,
        );

        g.lineTo(
            31,
            12,
        );

        g.close();
        g.fill();

        /**
         * 弓
         */
        g.strokeColor =
            new Color(
                121,
                83,
                49,
                255,
            );

        g.lineWidth = 4;

        g.arc(
            48,
            -2,
            31,
            -1.3,
            1.3,
        );

        g.stroke();

        g.moveTo(
            56,
            -31,
        );

        g.lineTo(
            56,
            27,
        );

        g.stroke();
    }

    private static drawKnightDetails(
        g: Graphics,
        palette:
            RolePalette,
    ): void {
        /**
         * 头盔
         */
        g.fillColor =
            new Color(
                222,
                226,
                231,
                255,
            );

        g.roundRect(
            -31,
            14,
            62,
            52,
            18,
        );

        g.fill();

        g.fillColor =
            palette.dark;

        g.rect(
            -25,
            38,
            50,
            7,
        );

        g.fill();

        /**
         * 盾牌
         */
        g.fillColor =
            palette.main;

        g.moveTo(
            38,
            18,
        );

        g.lineTo(
            65,
            7,
        );

        g.lineTo(
            59,
            -42,
        );

        g.lineTo(
            38,
            -57,
        );

        g.lineTo(
            17,
            -42,
        );

        g.lineTo(
            11,
            7,
        );

        g.close();
        g.fill();

        g.strokeColor =
            new Color(
                247,
                216,
                102,
                255,
            );

        g.lineWidth = 4;

        g.moveTo(
            38,
            7,
        );

        g.lineTo(
            38,
            -45,
        );

        g.stroke();
    }

    private static drawSupportDetails(
        g: Graphics,
        palette:
            RolePalette,
    ): void {
        /**
         * 小光环
         */
        g.strokeColor =
            new Color(
                245,
                219,
                104,
                255,
            );

        g.lineWidth = 4;

        g.ellipse(
            0,
            75,
            27,
            8,
        );

        g.stroke();

        /**
         * 法杖
         */
        g.strokeColor =
            new Color(
                104,
                76,
                52,
                255,
            );

        g.lineWidth = 5;

        g.moveTo(
            43,
            -50,
        );

        g.lineTo(
            48,
            52,
        );

        g.stroke();

        g.fillColor =
            new Color(
                115,
                221,
                174,
                255,
            );

        g.circle(
            49,
            60,
            9,
        );

        g.fill();
    }

    private static drawWarriorDetails(
        g: Graphics,
        palette:
            RolePalette,
    ): void {
        /**
         * 简化剑
         */
        g.strokeColor =
            new Color(
                183,
                192,
                199,
                255,
            );

        g.lineWidth = 7;

        g.moveTo(
            30,
            -44,
        );

        g.lineTo(
            55,
            42,
        );

        g.stroke();

        g.strokeColor =
            new Color(
                100,
                72,
                48,
                255,
            );

        g.lineWidth = 5;

        g.moveTo(
            22,
            -17,
        );

        g.lineTo(
            44,
            -23,
        );

        g.stroke();
    }

    private static createName(
        card: Node,
        name: string,
    ): void {
        this.createLabel(
            card,
            'Name',
            name,
            0,
            -18,
            25,
            168,
            34,
            new Color(
                48,
                45,
                42,
                255,
            ),
        );
    }

    private static createRole(
        card: Node,
        role: string,
        palette:
            RolePalette,
    ): void {
        const bg =
            new Node(
                'RoleBadge',
            );

        bg.layer =
            Layers.Enum.UI_2D;

        card.addChild(bg);

        bg.setPosition(
            0,
            -66,
            0,
        );

        bg.addComponent(
            UITransform,
        ).setContentSize(
            144,
            40,
        );

        const g =
            bg.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                palette.main.r,
                palette.main.g,
                palette.main.b,
                32,
            );

        g.roundRect(
            -72,
            -18,
            144,
            36,
            18,
        );

        g.fill();

        this.createLabel(
            bg,
            'Role',
            role,
            0,
            0,
            17,
            132,
            27,
            palette.dark,
        );
    }

    private static createRecruitButton(
        card: Node,
        palette:
            RolePalette,
    ): void {
        this.createLabel(
            card,
            'RecruitText',
            '招募',
            0,
            -149,
            22,
            120,
            32,
            new Color(
                255,
                255,
                247,
                255,
            ),
        );
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
        label.color =
            color;

        label.overflow =
            Label.Overflow.SHRINK;

        return label;
    }

    private static getRole(
        companion: CharacterDefinition,
    ): string {
        return getProfessionById(
            companion.professionId,
        ).roleLabel;
    }

    private static getRolePalette(
        role: string,
    ): RolePalette {
        if (
            role.includes(
                '法术',
            ) ||
            role.includes(
                '控制',
            )
        ) {
            return {
                main:
                    new Color(
                        136,
                        101,
                        207,
                        255,
                    ),

                soft:
                    new Color(
                        225,
                        211,
                        247,
                        255,
                    ),

                dark:
                    new Color(
                        87,
                        61,
                        139,
                        255,
                    ),
            };
        }

        if (
            role.includes(
                '远程',
            )
        ) {
            return {
                main:
                    new Color(
                        92,
                        167,
                        116,
                        255,
                    ),

                soft:
                    new Color(
                        216,
                        239,
                        215,
                        255,
                    ),

                dark:
                    new Color(
                        61,
                        112,
                        74,
                        255,
                    ),
            };
        }

        if (
            role.includes(
                '坦克',
            ) ||
            role.includes(
                '半肉',
            )
        ) {
            return {
                main:
                    new Color(
                        86,
                        139,
                        202,
                        255,
                    ),

                soft:
                    new Color(
                        215,
                        229,
                        247,
                        255,
                    ),

                dark:
                    new Color(
                        56,
                        91,
                        140,
                        255,
                    ),
            };
        }

        if (
            role.includes(
                '辅助',
            ) ||
            role.includes(
                '增益',
            )
        ) {
            return {
                main:
                    new Color(
                        207,
                        165,
                        76,
                        255,
                    ),

                soft:
                    new Color(
                        246,
                        235,
                        201,
                        255,
                    ),

                dark:
                    new Color(
                        137,
                        100,
                        42,
                        255,
                    ),
            };
        }

        return {
            main:
                new Color(
                    190,
                    104,
                    94,
                    255,
                ),

            soft:
                new Color(
                    244,
                    220,
                    214,
                    255,
                ),

            dark:
                new Color(
                    127,
                    66,
                    59,
                    255,
                ),
        };
    }
}
