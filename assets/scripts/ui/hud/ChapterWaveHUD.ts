/**
 * @architecture TonightDefense V1.0
 * @owner ui
 * @module hud
 *
 * 顶部战斗 HUD V1.2
 *
 * 目标：
 * - 保持原有 HUD 数据职责不变；
 * - 只优化布局层级、视觉样式与阅读体验；
 * - 不改动战斗主逻辑，不增加新的状态源。
 */
import {
    Color,
    Graphics,
    Label,
    Layers,
    Node,
    UITransform,
} from 'cc';

import {
    GameSettingsPanel,
} from '../panels/settings/GameSettingsPanel';

import {
    AudioManager,
} from '../../systems/audio/AudioManager';

import {
    BattlePausePanel,
} from '../panels/battle-pause/BattlePausePanel';

import {
    BattleArt,
} from '../resources/BattleArt';

interface HudLabelStyle {
    fontSize: number;
    lineHeight: number;
    color: Color;
}

export class ChapterWaveHUD {
    private readonly canvas: Node;

    private readonly root: Node;

    private readonly titleLabel: Label;

    private readonly levelLabel: Label;

    private readonly progressFill: Node;

    private readonly progressCountLabel: Label;

    private readonly barWidth = 270;

    constructor(
        canvas: Node,
    ) {
        this.canvas = canvas;

        const old =
            canvas.getChildByName(
                'ChapterWaveHUD',
            );

        if (old) {
            old.destroy();
        }

        const root =
            new Node(
                'ChapterWaveHUD',
            );

        root.layer =
            Layers.Enum.UI_2D;

        canvas.addChild(root);

        root.setPosition(
            0,
            568,
            0,
        );

        root.addComponent(
            UITransform,
        ).setContentSize(
            694,
            134,
        );

        this.drawPanel(root);

        BattleArt.attach(
            root,
            'top-hud-panel',
            694,
            134,
            'stretch',
            () => {
                root.getChildByName(
                    'HudShadow',
                )?.destroy();

                root.getChildByName(
                    'HudPanel',
                )?.destroy();
            },
        );

        this.createHudButtons(root);

        const titleNode =
            new Node(
                'WaveTitle',
            );

        titleNode.layer =
            Layers.Enum.UI_2D;

        root.addChild(titleNode);

        titleNode.setPosition(
            6,
            31,
            0,
        );

        titleNode.addComponent(
            UITransform,
        ).setContentSize(
            332,
            58,
        );

        this.drawTitlePlate(
            titleNode,
        );
        this.drawTitleLeaves(
            titleNode,
        );

        const title =
            this.createLabel(
                titleNode,
                'TitleText',
                '',
                0,
                1,
                296,
                44,
                {
                    fontSize: 25,
                    lineHeight: 31,
                    color:
                        new Color(
                            252,
                            248,
                            234,
                            255,
                        ),
                },
            );

        const levelNode =
            new Node(
                'EnemyLevelPill',
            );

        levelNode.layer =
            Layers.Enum.UI_2D;

        root.addChild(levelNode);

        levelNode.setPosition(
            252,
            31,
            0,
        );

        levelNode.addComponent(
            UITransform,
        ).setContentSize(
            156,
            56,
        );

        this.drawLevelCard(
            levelNode,
        );
        this.drawMonsterIcon(
            levelNode,
        );

        this.createLabel(
            levelNode,
            'EnemyLevelCaption',
            '当前威胁',
            24,
            11,
            92,
            18,
            {
                fontSize: 11,
                lineHeight: 14,
                color:
                    new Color(
                        123,
                        108,
                        84,
                        255,
                    ),
            },
        );

        const levelLabel =
            this.createLabel(
                levelNode,
                'EnemyLevelText',
                '',
                24,
                -9,
                104,
                24,
                {
                    fontSize: 18,
                    lineHeight: 22,
                    color:
                        new Color(
                            58,
                            62,
                            67,
                            255,
                        ),
                },
            );

        const progressNameNode =
            new Node(
                'ProgressNamePill',
            );

        progressNameNode.layer =
            Layers.Enum.UI_2D;

        root.addChild(
            progressNameNode,
        );

        progressNameNode.setPosition(
            -179,
            -30,
            0,
        );

        progressNameNode.addComponent(
            UITransform,
        ).setContentSize(
            132,
            34,
        );

        this.drawSoftPill(
            progressNameNode,
            132,
            34,
            new Color(
                244,
                230,
                192,
                255,
            ),
            new Color(
                222,
                203,
                154,
                255,
            ),
        );

        this.createLabel(
            progressNameNode,
            'ProgressNameText',
            '本小关进度',
            0,
            0,
            116,
            26,
            {
                fontSize: 16,
                lineHeight: 20,
                color:
                    new Color(
                        96,
                        82,
                        57,
                        255,
                    ),
            },
        );

        const barRoot =
            new Node(
                'WaveProgress',
            );

        barRoot.layer =
            Layers.Enum.UI_2D;

        root.addChild(barRoot);

        barRoot.setPosition(
            32,
            -30,
            0,
        );

        barRoot.addComponent(
            UITransform,
        ).setContentSize(
            this.barWidth,
            26,
        );

        this.drawProgressTrack(
            barRoot,
        );

        const fill =
            new Node(
                'WaveProgressFill',
            );

        fill.layer =
            Layers.Enum.UI_2D;

        barRoot.addChild(fill);

        fill.setPosition(
            -this.barWidth /
                2 +
                4,
            0,
            0,
        );

        const fillTransform =
            fill.addComponent(
                UITransform,
            );

        fillTransform.setAnchorPoint(
            0,
            0.5,
        );

        fillTransform.setContentSize(
            this.barWidth - 8,
            12,
        );

        const fg =
            fill.addComponent(
                Graphics,
            );

        fg.fillColor =
            new Color(
                72,
                133,
                220,
                255,
            );

        fg.roundRect(
            0,
            -6,
            this.barWidth - 8,
            12,
            6,
        );

        fg.fill();

        fg.fillColor =
            new Color(
                151,
                212,
                255,
                185,
            );

        fg.roundRect(
            8,
            1,
            this.barWidth - 24,
            3,
            2,
        );

        fg.fill();

        const countNode =
            new Node(
                'ProgressCountPill',
            );

        countNode.layer =
            Layers.Enum.UI_2D;

        root.addChild(countNode);

        countNode.setPosition(
            228,
            -30,
            0,
        );

        countNode.addComponent(
            UITransform,
        ).setContentSize(
            78,
            34,
        );

        this.drawSoftPill(
            countNode,
            78,
            34,
            new Color(
                244,
                230,
                192,
                255,
            ),
            new Color(
                222,
                203,
                154,
                255,
            ),
        );

        const countLabel =
            this.createLabel(
                countNode,
                'ProgressCountText',
                '0/0',
                0,
                0,
                68,
                26,
                {
                    fontSize: 17,
                    lineHeight: 21,
                    color:
                        new Color(
                            70,
                            74,
                            72,
                            255,
                        ),
                },
            );

        this.createSettingsButton(
            root,
        );

        this.root = root;
        this.titleLabel = title;
        this.levelLabel = levelLabel;
        this.progressFill = fill;
        this.progressCountLabel = countLabel;
    }

    update(
        chapterNumber: number,
        waveNumber: number,
        enemyLevel: number,
        cleared: number,
        total: number,
        _phaseText = '',
    ): void {
        this.titleLabel.string =
            `第${chapterNumber}关 · 小关 ${waveNumber}/40`;

        this.levelLabel.string =
            `怪物 Lv.${enemyLevel}`;

        const safeTotal =
            Math.max(
                1,
                total,
            );

        const currentWaveRatio =
            Math.max(
                0,
                Math.min(
                    1,
                    cleared /
                        safeTotal,
                ),
            );

        this.progressFill.setScale(
            currentWaveRatio,
            1,
            1,
        );

        this.progressCountLabel.string =
            `${Math.min(cleared, total)}/${total}`;
    }

    destroy(): void {
        if (
            this.root.isValid
        ) {
            this.root.destroy();
        }
    }

    private drawPanel(
        root: Node,
    ): void {
        const shadow =
            new Node(
                'HudShadow',
            );

        shadow.layer =
            Layers.Enum.UI_2D;

        root.addChild(shadow);

        shadow.setPosition(
            0,
            -5,
            0,
        );

        const shadowGraphics =
            shadow.addComponent(
                Graphics,
            );

        shadowGraphics.fillColor =
            new Color(
                50,
                63,
                55,
                55,
            );

        shadowGraphics.roundRect(
            -346,
            -64,
            692,
            128,
            28,
        );

        shadowGraphics.fill();

        const panel =
            new Node(
                'HudPanel',
            );

        panel.layer =
            Layers.Enum.UI_2D;

        root.addChild(panel);

        const g =
            panel.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                248,
                242,
                216,
                252,
            );

        g.roundRect(
            -346,
            -64,
            692,
            128,
            28,
        );

        g.fill();

        g.fillColor =
            new Color(
                255,
                251,
                238,
                110,
            );

        g.roundRect(
            -334,
            4,
            668,
            42,
            18,
        );

        g.fill();

        g.strokeColor =
            new Color(
                220,
                203,
                161,
                255,
            );

        g.lineWidth = 2.5;

        g.roundRect(
            -346,
            -64,
            692,
            128,
            28,
        );

        g.stroke();

        g.strokeColor =
            new Color(
                228,
                196,
                118,
                255,
            );

        g.lineWidth = 3;

        g.moveTo(
            -316,
            -46,
        );

        g.lineTo(
            316,
            -46,
        );

        g.stroke();
    }

    private drawTitlePlate(
        parent: Node,
    ): void {
        const g =
            parent.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                68,
                82,
                90,
                255,
            );

        g.roundRect(
            -166,
            -29,
            332,
            58,
            26,
        );
        g.fill();

        g.fillColor =
            new Color(
                96,
                116,
                124,
                120,
            );

        g.roundRect(
            -146,
            5,
            292,
            10,
            5,
        );
        g.fill();

        g.strokeColor =
            new Color(
                226,
                198,
                127,
                255,
            );

        g.lineWidth = 3;

        g.roundRect(
            -166,
            -29,
            332,
            58,
            26,
        );
        g.stroke();
    }

    private drawLevelCard(
        parent: Node,
    ): void {
        const levelBg =
            parent.addComponent(
                Graphics,
            );

        levelBg.fillColor =
            new Color(
                245,
                232,
                193,
                255,
            );

        levelBg.roundRect(
            -78,
            -28,
            156,
            56,
            24,
        );
        levelBg.fill();

        levelBg.fillColor =
            new Color(
                255,
                248,
                230,
                115,
            );

        levelBg.roundRect(
            -68,
            6,
            136,
            10,
            5,
        );
        levelBg.fill();

        levelBg.strokeColor =
            new Color(
                220,
                197,
                140,
                255,
            );

        levelBg.lineWidth = 2;

        levelBg.roundRect(
            -78,
            -28,
            156,
            56,
            24,
        );

        levelBg.stroke();
    }

    private drawSoftPill(
        parent: Node,
        width: number,
        height: number,
        fillColor: Color,
        strokeColor: Color,
    ): void {
        const g =
            parent.addComponent(
                Graphics,
            );

        g.fillColor =
            fillColor;

        g.roundRect(
            -width / 2,
            -height / 2,
            width,
            height,
            height / 2,
        );
        g.fill();

        g.fillColor =
            new Color(
                255,
                250,
                235,
                110,
            );

        g.roundRect(
            -width / 2 + 8,
            3,
            width - 16,
            5,
            2,
        );
        g.fill();

        g.strokeColor =
            strokeColor;
        g.lineWidth = 2;

        g.roundRect(
            -width / 2,
            -height / 2,
            width,
            height,
            height / 2,
        );
        g.stroke();
    }

    private drawProgressTrack(
        parent: Node,
    ): void {
        const g =
            parent.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                61,
                68,
                72,
                255,
            );

        g.roundRect(
            -this.barWidth / 2,
            -9,
            this.barWidth,
            18,
            9,
        );
        g.fill();

        g.fillColor =
            new Color(
                92,
                100,
                104,
                145,
            );

        g.roundRect(
            -this.barWidth / 2 + 6,
            1,
            this.barWidth - 12,
            4,
            2,
        );
        g.fill();

        g.strokeColor =
            new Color(
                44,
                49,
                53,
                255,
            );
        g.lineWidth = 2;

        g.roundRect(
            -this.barWidth / 2,
            -9,
            this.barWidth,
            18,
            9,
        );
        g.stroke();
    }

    private createHudButtons(
        root: Node,
    ): void {
        const group =
            new Node(
                'ControlButtonGroup',
            );

        group.layer =
            Layers.Enum.UI_2D;

        root.addChild(group);
        group.setPosition(
            -255,
            30,
            0,
        );

        group.addComponent(
            UITransform,
        ).setContentSize(
            132,
            68,
        );

        const groupBg =
            group.addComponent(
                Graphics,
            );

        groupBg.fillColor =
            new Color(
                242,
                235,
                214,
                210,
            );

        groupBg.roundRect(
            -66,
            -34,
            132,
            68,
            18,
        );
        groupBg.fill();

        groupBg.strokeColor =
            new Color(
                219,
                202,
                165,
                255,
            );
        groupBg.lineWidth = 2;
        groupBg.roundRect(
            -66,
            -34,
            132,
            68,
            18,
        );
        groupBg.stroke();

        const pauseButton =
            this.createSmallButton(
                group,
                -31,
                0,
                'Ⅱ',
            );

        pauseButton.on(
            Node.EventType.TOUCH_END,
            () => {
                AudioManager.playUi();
                BattlePausePanel.open(
                    this.canvas,
                );
            },
        );

        this.createSmallButton(
            group,
            31,
            0,
            '≫',
        );
    }

    private createSmallButton(
        parent: Node,
        x: number,
        y: number,
        text: string,
    ): Node {
        const node =
            new Node(
                `HudButton_${text}`,
            );

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
            52,
            52,
        );

        const g =
            node.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                96,
                108,
                114,
                36,
            );

        g.roundRect(
            -24,
            -26,
            48,
            48,
            12,
        );
        g.fill();

        g.fillColor =
            new Color(
                250,
                248,
                240,
                255,
            );

        g.roundRect(
            -26,
            -24,
            48,
            48,
            12,
        );
        g.fill();

        g.fillColor =
            new Color(
                255,
                252,
                244,
                130,
            );

        g.roundRect(
            -18,
            7,
            32,
            5,
            2,
        );
        g.fill();

        g.strokeColor =
            new Color(
                218,
                210,
                190,
                255,
            );
        g.lineWidth = 2;

        g.roundRect(
            -26,
            -24,
            48,
            48,
            12,
        );
        g.stroke();

        this.createLabel(
            node,
            'Icon',
            text,
            0,
            -1,
            40,
            34,
            {
                fontSize: 25,
                lineHeight: 28,
                color:
                    new Color(
                        58,
                        77,
                        87,
                        255,
                    ),
            },
        );

        return node;
    }

    private createSettingsButton(
        parent: Node,
    ): void {
        const node =
            new Node(
                'HudSettingsButton',
            );

        node.layer =
            Layers.Enum.UI_2D;

        parent.addChild(node);

        node.setPosition(
            317,
            -30,
            0,
        );

        node.addComponent(
            UITransform,
        ).setContentSize(
            42,
            42,
        );

        const g =
            node.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                243,
                229,
                191,
                255,
            );
        g.circle(
            0,
            0,
            20,
        );
        g.fill();

        g.fillColor =
            new Color(
                255,
                248,
                232,
                120,
            );
        g.circle(
            0,
            6,
            11,
        );
        g.fill();

        g.strokeColor =
            new Color(
                210,
                190,
                145,
                255,
            );
        g.lineWidth = 2;
        g.circle(
            0,
            0,
            20,
        );
        g.stroke();

        this.createLabel(
            node,
            'SettingsText',
            '⚙',
            0,
            -1,
            28,
            28,
            {
                fontSize: 18,
                lineHeight: 22,
                color:
                    new Color(
                        72,
                        77,
                        74,
                        255,
                    ),
            },
        );

        node.on(
            Node.EventType.TOUCH_END,
            () => {
                AudioManager.playUi();
                GameSettingsPanel.open(
                    this.canvas,
                );
            },
        );
    }

    private drawMonsterIcon(
        parent: Node,
    ): void {
        const icon =
            new Node(
                'MonsterIcon',
            );

        icon.layer =
            Layers.Enum.UI_2D;

        parent.addChild(icon);

        icon.setPosition(
            -51,
            -1,
            0,
        );

        const g =
            icon.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                60,
                77,
                89,
                255,
            );

        g.circle(
            0,
            0,
            14,
        );
        g.fill();

        g.moveTo(-10, 8);
        g.lineTo(-16, 16);
        g.lineTo(-4, 12);
        g.close();
        g.fill();

        g.moveTo(10, 8);
        g.lineTo(16, 16);
        g.lineTo(4, 12);
        g.close();
        g.fill();

        g.fillColor =
            new Color(
                249,
                244,
                220,
                255,
            );

        g.circle(-5, 1, 2.3);
        g.circle(5, 1, 2.3);
        g.fill();
    }

    private drawTitleLeaves(
        parent: Node,
    ): void {
        const decoration =
            new Node(
                'TitleLeaves',
            );

        decoration.layer =
            Layers.Enum.UI_2D;

        parent.addChild(
            decoration,
        );

        const g =
            decoration.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                121,
                184,
                77,
                255,
            );

        g.ellipse(
            -168,
            4,
            10,
            18,
        );
        g.fill();

        g.ellipse(
            -158,
            -8,
            8,
            14,
        );
        g.fill();

        g.ellipse(
            168,
            4,
            10,
            18,
        );
        g.fill();

        g.ellipse(
            158,
            -8,
            8,
            14,
        );
        g.fill();
    }

    private createLabel(
        parent: Node,
        name: string,
        text: string,
        x: number,
        y: number,
        width: number,
        height: number,
        style: HudLabelStyle,
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
            style.fontSize;
        label.lineHeight =
            style.lineHeight;
        label.color =
            style.color;

        label.overflow =
            Label.Overflow.SHRINK;

        return label;
    }
}
