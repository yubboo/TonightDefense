/**
 * @architecture TonightDefense V1.0
 * @owner ui
 * @module battle-pause
 *
 * 战斗暂停弹窗。
 *
 * 只负责 UI 与用户意图：
 * - 继续游戏
 * - 游戏设置
 * - 重新开始（不重复扣体力）
 * - 返回大厅（结束本局，不返还已消耗体力）
 *
 * 真正的暂停状态统一交给 BattlePauseService。
 */
import {
    BlockInputEvents,
    Color,
    Graphics,
    Label,
    Layers,
    Node,
    UITransform,
    director,
} from 'cc';

import {
    BattlePauseService,
} from '../../../systems/feature/pause/BattlePauseService';

import {
    AudioManager,
} from '../../../systems/audio/AudioManager';

import {
    GameSettingsPanel,
} from '../settings/GameSettingsPanel';

interface ButtonStyle {
    fill: Color;
    stroke: Color;
    text: Color;
}

export class BattlePausePanel {
    private readonly canvas: Node;

    private readonly root: Node;

    private readonly statusLabel: Label;

    private busy = false;

    static open(
        canvas: Node,
    ): BattlePausePanel {
        const old =
            canvas.getChildByName(
                'BattlePausePanel',
            );

        if (old) {
            old.destroy();
        }

        return new BattlePausePanel(
            canvas,
        );
    }

    constructor(
        canvas: Node,
    ) {
        this.canvas = canvas;

        const canvasSize =
            canvas
                .getComponent(
                    UITransform,
                )
                ?.contentSize;

        const width =
            Math.max(
                720,
                canvasSize?.width ?? 720,
            );

        const height =
            Math.max(
                1280,
                canvasSize?.height ?? 1280,
            );

        const root =
            new Node(
                'BattlePausePanel',
            );

        root.layer =
            Layers.Enum.UI_2D;

        canvas.addChild(root);
        root.setSiblingIndex(
            canvas.children.length - 1,
        );

        root.addComponent(
            UITransform,
        ).setContentSize(
            width,
            height,
        );

        root.addComponent(
            BlockInputEvents,
        );

        this.drawBackdrop(
            root,
            width,
            height,
        );

        const card =
            new Node(
                'PauseCard',
            );

        card.layer =
            Layers.Enum.UI_2D;

        root.addChild(card);
        card.setPosition(
            0,
            8,
            0,
        );

        card.addComponent(
            UITransform,
        ).setContentSize(
            520,
            610,
        );

        const cardG =
            card.addComponent(
                Graphics,
            );

        cardG.fillColor =
            new Color(
                250,
                244,
                218,
                255,
            );

        cardG.roundRect(
            -260,
            -305,
            520,
            610,
            30,
        );
        cardG.fill();

        cardG.strokeColor =
            new Color(
                205,
                176,
                105,
                255,
            );
        cardG.lineWidth = 4;
        cardG.roundRect(
            -260,
            -305,
            520,
            610,
            30,
        );
        cardG.stroke();

        this.createLabel(
            card,
            'Title',
            '游戏暂停',
            0,
            238,
            420,
            58,
            36,
            new Color(
                56,
                70,
                61,
                255,
            ),
        );

        this.createLabel(
            card,
            'Subtitle',
            '战斗已暂停',
            0,
            193,
            420,
            36,
            19,
            new Color(
                116,
                108,
                82,
                255,
            ),
        );

        this.createButton(
            card,
            'ResumeButton',
            '继续游戏',
            0,
            112,
            {
                fill:
                    new Color(
                        76,
                        139,
                        93,
                        255,
                    ),
                stroke:
                    new Color(
                        52,
                        105,
                        68,
                        255,
                    ),
                text:
                    new Color(
                        255,
                        252,
                        235,
                        255,
                    ),
            },
            () => this.resumeBattle(),
        );

        this.createButton(
            card,
            'SettingsButton',
            '游戏设置',
            0,
            28,
            {
                fill:
                    new Color(
                        242,
                        229,
                        190,
                        255,
                    ),
                stroke:
                    new Color(
                        205,
                        176,
                        105,
                        255,
                    ),
                text:
                    new Color(
                        69,
                        73,
                        65,
                        255,
                    ),
            },
            () => {
                GameSettingsPanel.open(
                    this.canvas,
                );
            },
        );

        this.createButton(
            card,
            'RestartButton',
            '重新开始',
            0,
            -56,
            {
                fill:
                    new Color(
                        234,
                        188,
                        79,
                        255,
                    ),
                stroke:
                    new Color(
                        183,
                        135,
                        45,
                        255,
                    ),
                text:
                    new Color(
                        66,
                        58,
                        42,
                        255,
                    ),
            },
            () => this.restartBattle(),
        );

        this.createButton(
            card,
            'ReturnButton',
            '返回大厅',
            0,
            -140,
            {
                fill:
                    new Color(
                        232,
                        220,
                        192,
                        255,
                    ),
                stroke:
                    new Color(
                        180,
                        151,
                        99,
                        255,
                    ),
                text:
                    new Color(
                        102,
                        72,
                        57,
                        255,
                    ),
            },
            () => this.returnToMainMenu(),
        );

        const status =
            this.createLabel(
                card,
                'StatusText',
                '重新开始不会重复扣除体力\n返回大厅会结束本局，已消耗体力不返还',
                0,
                -238,
                440,
                64,
                16,
                new Color(
                    126,
                    109,
                    79,
                    255,
                ),
            );

        status.lineHeight = 23;
        this.statusLabel = status;
        this.root = root;

        /**
         * UI 已同步创建完成后再暂停 Director。
         * Cocos Director.pause() 会停止游戏逻辑，
         * 但继续渲染并保留 UI 事件响应。
         */
        BattlePauseService.pause();
    }

    private resumeBattle(): void {
        if (this.busy) {
            return;
        }

        BattlePauseService.resume();

        if (this.root.isValid) {
            this.root.destroy();
        }
    }

    private restartBattle(): void {
        if (this.busy) {
            return;
        }

        this.busy = true;
        this.statusLabel.string =
            '正在重新开始本局…';

        BattlePauseService
            .resumeForSceneChange();

        director.loadScene(
            'Battle',
            (error) => {
                if (!error) {
                    return;
                }

                this.busy = false;
                this.statusLabel.string =
                    '重新开始失败，请重试';

                BattlePauseService.pause();

                console.error(
                    '[今晚守城] 重新加载 Battle.scene 失败',
                    error,
                );
            },
        );
    }

    private returnToMainMenu(): void {
        if (this.busy) {
            return;
        }

        this.busy = true;
        this.statusLabel.string =
            '正在返回大厅…';

        BattlePauseService
            .resumeForSceneChange();

        director.loadScene(
            'MainMenu',
            (error) => {
                if (!error) {
                    return;
                }

                this.busy = false;
                this.statusLabel.string =
                    '返回大厅失败，请重试';

                BattlePauseService.pause();

                console.error(
                    '[今晚守城] MainMenu.scene 加载失败',
                    error,
                );
            },
        );
    }

    private drawBackdrop(
        root: Node,
        width: number,
        height: number,
    ): void {
        const veil =
            new Node(
                'PauseVeil',
            );

        veil.layer =
            Layers.Enum.UI_2D;
        root.addChild(veil);

        veil.addComponent(
            UITransform,
        ).setContentSize(
            width,
            height,
        );

        const g =
            veil.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                24,
                35,
                32,
                145,
            );

        g.rect(
            -width / 2,
            -height / 2,
            width,
            height,
        );
        g.fill();
    }

    private createButton(
        parent: Node,
        name: string,
        text: string,
        x: number,
        y: number,
        style: ButtonStyle,
        onPress: () => void,
    ): Node {
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
            390,
            66,
        );

        const g =
            node.addComponent(
                Graphics,
            );

        g.fillColor = style.fill;
        g.roundRect(
            -195,
            -33,
            390,
            66,
            18,
        );
        g.fill();

        g.strokeColor = style.stroke;
        g.lineWidth = 3;
        g.roundRect(
            -195,
            -33,
            390,
            66,
            18,
        );
        g.stroke();

        this.createLabel(
            node,
            'Text',
            text,
            0,
            0,
            350,
            48,
            24,
            style.text,
        );

        node.on(
            Node.EventType.TOUCH_END,
            () => {
                if (this.busy) {
                    return;
                }

                AudioManager.playUi();
                onPress();
            },
        );

        return node;
    }

    private createLabel(
        parent: Node,
        name: string,
        text: string,
        x: number,
        y: number,
        width: number,
        height: number,
        fontSize: number,
        color: Color,
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
        label.fontSize = fontSize;
        label.lineHeight =
            fontSize + 6;
        label.color = color;
        label.horizontalAlign =
            Label.HorizontalAlign.CENTER;
        label.verticalAlign =
            Label.VerticalAlign.CENTER;

        return label;
    }
}
