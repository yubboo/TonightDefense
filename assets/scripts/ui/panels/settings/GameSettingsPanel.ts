/**
 * @architecture TonightDefense V1.0
 * @owner ui
 * @module settings
 *
 * 通用“游戏设置”弹窗：
 * - 回归居中弹窗布局
 * - 背景使用低分辨率 RenderTexture 放大形成跨平台模糊/磨砂效果
 * - 帧率 30 / 60 / 120
 * - 主音量 / BGM / 游戏音效
 * - 一键静音
 */
import {
    BlockInputEvents,
    Camera,
    Color,
    Director,
    Graphics,
    Label,
    Layers,
    Node,
    RenderTexture,
    Sprite,
    SpriteFrame,
    UITransform,
    director,
    sys,
} from 'cc';

import {
    GameFrameRate,
    GamePerformanceSettings,
} from '../../../systems/settings/GamePerformanceSettings';

import {
    AudioManager,
} from '../../../systems/audio/AudioManager';

import {
    GameAudioSettings,
} from '../../../systems/audio/GameAudioSettings';

interface FrameButtonVisual {
    node: Node;
    graphics: Graphics;
    label: Label;
    value: GameFrameRate;
    supported: boolean;
}

interface VolumeRowVisual {
    key:
        | 'master'
        | 'bgm'
        | 'sfx';
    bar: Graphics;
    percentLabel: Label;
}

export class GameSettingsPanel {
    private readonly root: Node;

    private readonly statusLabel: Label;

    private readonly muteButton:
        Node;

    private readonly muteGraphics:
        Graphics;

    private readonly muteLabel:
        Label;

    private readonly frameButtons:
        FrameButtonVisual[] = [];

    private readonly volumeRows:
        VolumeRowVisual[] = [];

    private backdropTexture:
        RenderTexture | null = null;

    private backdropSpriteFrame:
        SpriteFrame | null = null;

    private captureCameraNode:
        Node | null = null;

    static open(
        canvas: Node,
    ): GameSettingsPanel {
        canvas
            .getChildByName(
                'GameSettingsPanel',
            )
            ?.destroy();

        return new GameSettingsPanel(
            canvas,
        );
    }

    constructor(
        canvas: Node,
    ) {
        GamePerformanceSettings
            .ensureApplied();

        GameAudioSettings
            .ensureLoaded();

        AudioManager.ensure();

        const canvasSize =
            canvas
                .getComponent(
                    UITransform,
                )
                ?.contentSize;

        const pageWidth =
            Math.max(
                720,
                canvasSize?.width ?? 720,
            );

        const pageHeight =
            Math.max(
                1280,
                canvasSize?.height ?? 1280,
            );

        const root =
            new Node(
                'GameSettingsPanel',
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
            pageWidth,
            pageHeight,
        );

        root.addComponent(
            BlockInputEvents,
        );

        // 先抓取当前场景一帧，低分辨率放大后作为弹窗背景。
        // 这种做法不依赖浏览器 CSS，在 Cocos Web / 微信小游戏中都能工作；
        // 如果当前环境无法创建离屏相机，会自动退化为普通磨砂遮罩。
        this.prepareBlurredBackdrop(
            canvas,
            root,
            pageWidth,
            pageHeight,
        );

        const veil =
            new Node(
                'FrostedVeil',
            );

        veil.layer =
            Layers.Enum.UI_2D;
        root.addChild(veil);
        veil.addComponent(
            UITransform,
        ).setContentSize(
            pageWidth,
            pageHeight,
        );

        const dim =
            veil.addComponent(
                Graphics,
            );

        dim.fillColor =
            new Color(
                21,
                30,
                31,
                104,
            );

        dim.rect(
            -pageWidth / 2,
            -pageHeight / 2,
            pageWidth,
            pageHeight,
        );

        dim.fill();

        // 再叠一层暖色薄雾，让背景真正退到弹窗后面，
        // 同时避免纯黑遮罩带来的“脏”和压迫感。
        dim.fillColor =
            new Color(
                244,
                237,
                212,
                32,
            );
        dim.rect(
            -pageWidth / 2,
            -pageHeight / 2,
            pageWidth,
            pageHeight,
        );
        dim.fill();

        const shadow =
            new Node(
                'CardShadow',
            );
        shadow.layer =
            Layers.Enum.UI_2D;
        root.addChild(shadow);
        shadow.setPosition(
            0,
            10,
            0,
        );
        shadow.addComponent(
            UITransform,
        ).setContentSize(
            594,
            884,
        );
        const shadowG =
            shadow.addComponent(
                Graphics,
            );
        shadowG.fillColor =
            new Color(
                9,
                16,
                17,
                72,
            );
        shadowG.roundRect(
            -297,
            -442,
            594,
            884,
            34,
        );
        shadowG.fill();

        const card =
            new Node(
                'SettingsCard',
            );

        card.layer =
            Layers.Enum.UI_2D;

        root.addChild(card);
        card.setPosition(
            0,
            20,
            0,
        );

        card.addComponent(
            UITransform,
        ).setContentSize(
            570,
            860,
        );

        const cardG =
            card.addComponent(
                Graphics,
            );

        cardG.fillColor =
            new Color(
                251,
                246,
                226,
                255,
            );

        cardG.roundRect(
            -285,
            -430,
            570,
            860,
            30,
        );

        cardG.fill();

        cardG.strokeColor =
            new Color(
                219,
                190,
                125,
                255,
            );

        cardG.lineWidth = 4;

        cardG.roundRect(
            -285,
            -430,
            570,
            860,
            30,
        );

        cardG.stroke();

        this.createLabel(
            card,
            'Title',
            '游戏设置',
            0,
            365,
            34,
            260,
            48,
            new Color(
                55,
                62,
                62,
                255,
            ),
        );

        this.createLabel(
            card,
            'FrameRateTitle',
            '画面帧率',
            -205,
            300,
            22,
            130,
            34,
            new Color(
                71,
                75,
                70,
                255,
            ),
        );

        const options =
            GamePerformanceSettings
                .getFrameRateOptions();

        const xs = [
            -168,
            0,
            168,
        ];

        for (
            let i = 0;
            i < options.length;
            i += 1
        ) {
            const option =
                options[i];

            const button =
                this.createFrameButton(
                    card,
                    xs[i],
                    235,
                    option.value,
                    option.supported,
                );

            this.frameButtons.push(
                button,
            );
        }

        this.statusLabel =
            this.createLabel(
                card,
                'Status',
                '',
                0,
                165,
                18,
                500,
                32,
                new Color(
                    70,
                    78,
                    78,
                    255,
                ),
            );

        this.createLabel(
            card,
            'AudioTitle',
            '声音',
            -225,
            105,
            24,
            90,
            34,
            new Color(
                71,
                75,
                70,
                255,
            ),
        );

        this.volumeRows.push(
            this.createVolumeRow(
                card,
                'master',
                '主音量',
                42,
            ),
            this.createVolumeRow(
                card,
                'bgm',
                '背景音乐',
                -42,
            ),
            this.createVolumeRow(
                card,
                'sfx',
                '游戏音效',
                -126,
            ),
        );

        const mute =
            this.createActionButton(
                card,
                'Mute',
                '',
                0,
                -215,
                230,
                58,
            );

        this.muteButton = mute;
        this.muteGraphics =
            mute.getComponent(
                Graphics,
            )!;
        this.muteLabel =
            mute.getChildByName(
                'Text',
            )!
                .getComponent(
                    Label,
                )!;

        mute.on(
            Node.EventType.TOUCH_END,
            () => {
                const wasMuted =
                    GameAudioSettings
                        .isMuted();

                if (!wasMuted) {
                    AudioManager.playUi();
                }

                const muted =
                    GameAudioSettings
                        .toggleMuted();

                AudioManager
                    .refreshVolumes();

                if (!muted) {
                    AudioManager.playUi();
                }

                this.refresh();
            },
        );

        const tipText =
            GamePerformanceSettings
                .isWeChatMiniGame()
                ? '微信小游戏最高使用 60 FPS；音量设置会自动保存。'
                : '120 FPS 需要高刷屏幕与足够性能；音量设置会自动保存。';

        this.createLabel(
            card,
            'Tip',
            tipText,
            0,
            -292,
            16,
            500,
            54,
            new Color(
                116,
                105,
                83,
                255,
            ),
        );

        const close =
            this.createActionButton(
                card,
                'Close',
                '完成',
                0,
                -370,
                190,
                58,
            );

        close.on(
            Node.EventType.TOUCH_END,
            () => {
                AudioManager.playUi();
                this.destroy();
            },
        );

        this.root = root;

        this.refresh();
    }

    destroy(): void {
        if (
            this.captureCameraNode?.isValid
        ) {
            this.captureCameraNode.destroy();
        }

        this.captureCameraNode = null;

        if (
            this.root.isValid
        ) {
            this.root.destroy();
        }

        this.backdropSpriteFrame
            ?.destroy();
        this.backdropTexture
            ?.destroy();

        this.backdropSpriteFrame =
            null;
        this.backdropTexture =
            null;
    }

    /**
     * 用一次性离屏相机抓取当前场景。RenderTexture 故意以 1/8 尺寸渲染，
     * 再由 Sprite 双线性放大，从而得到轻量的“背景模糊/磨砂”效果。
     * 捕获完成后立刻销毁额外相机，设置面板打开期间不会持续增加渲染开销。
     */
    private prepareBlurredBackdrop(
        canvas: Node,
        root: Node,
        width: number,
        height: number,
    ): void {
        root.active = false;

        const sourceCamera =
            canvas
                .getChildByName(
                    'Camera',
                )
                ?.getComponent(
                    Camera,
                ) ??
            director
                .getScene()
                ?.getComponentsInChildren(
                    Camera,
                )[0] ??
            null;

        if (!sourceCamera) {
            root.active = true;
            return;
        }

        try {
            const blurScale = 8;
            const texture =
                new RenderTexture();

            texture.reset({
                width:
                    Math.max(
                        90,
                        Math.floor(
                            width /
                            blurScale,
                        ),
                    ),
                height:
                    Math.max(
                        160,
                        Math.floor(
                            height /
                            blurScale,
                        ),
                    ),
            });

            const frame =
                new SpriteFrame();
            frame.texture = texture;

            // RenderTexture 在 Web / 小游戏上需要翻转 Y；原生平台保持默认。
            frame.flipUVY =
                !sys.isNative;

            const backdrop =
                new Node(
                    'BlurredBackdrop',
                );
            backdrop.layer =
                Layers.Enum.UI_2D;
            root.addChild(backdrop);
            backdrop.setSiblingIndex(0);
            backdrop.addComponent(
                UITransform,
            ).setContentSize(
                width,
                height,
            );

            const sprite =
                backdrop.addComponent(
                    Sprite,
                );
            sprite.sizeMode =
                Sprite.SizeMode.CUSTOM;
            sprite.spriteFrame =
                frame;

            const captureNode =
                new Node(
                    '__SettingsBlurCamera__',
                );

            const sourceParent =
                sourceCamera.node.parent ??
                director.getScene();

            sourceParent?.addChild(
                captureNode,
            );

            captureNode.setPosition(
                sourceCamera.node.position,
            );
            captureNode.setRotation(
                sourceCamera.node.rotation,
            );
            captureNode.setScale(
                sourceCamera.node.scale,
            );

            const captureCamera =
                captureNode.addComponent(
                    Camera,
                );

            const source =
                sourceCamera as unknown as
                Record<string, unknown>;
            const capture =
                captureCamera as unknown as
                Record<string, unknown>;

            const properties = [
                'projection',
                'fov',
                'fovAxis',
                'orthoHeight',
                'near',
                'far',
                'clearFlags',
                'clearColor',
                'visibility',
                'rect',
                'screenScale',
            ];

            for (
                const key of properties
            ) {
                if (
                    source[key] !==
                    undefined
                ) {
                    capture[key] =
                        source[key];
                }
            }

            captureCamera.targetTexture =
                texture;

            this.backdropTexture =
                texture;
            this.backdropSpriteFrame =
                frame;
            this.captureCameraNode =
                captureNode;

            director.once(
                Director.EVENT_AFTER_DRAW,
                () => {
                    if (
                        captureNode.isValid
                    ) {
                        captureNode.destroy();
                    }

                    this.captureCameraNode =
                        null;

                    if (!root.isValid) {
                        return;
                    }

                    // 3.8.x 某些平台第一次绑定 RenderTexture 时需要切一次 active，
                    // 才能稳定刷新 SpriteFrame。
                    backdrop.active = false;
                    backdrop.active = true;
                    root.active = true;
                },
            );
        } catch (error) {
            console.warn(
                '[今晚守城] 设置背景模糊创建失败，已退化为磨砂遮罩',
                error,
            );

            if (
                this.captureCameraNode
                    ?.isValid
            ) {
                this.captureCameraNode
                    .destroy();
            }

            this.captureCameraNode =
                null;
            root.active = true;
        }
    }

    private createFrameButton(
        parent: Node,
        x: number,
        y: number,
        value:
            GameFrameRate,
        supported:
            boolean,
    ): FrameButtonVisual {
        const node =
            new Node(
                `FrameRate_${value}`,
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
            142,
            72,
        );

        const graphics =
            node.addComponent(
                Graphics,
            );

        const label =
            this.createLabel(
                node,
                'Text',
                `${value} FPS`,
                0,
                0,
                21,
                132,
                38,
                new Color(
                    65,
                    70,
                    67,
                    255,
                ),
            );

        if (supported) {
            node.on(
                Node.EventType.TOUCH_END,
                () => {
                    AudioManager.playUi();

                    GamePerformanceSettings
                        .setFrameRate(
                            value,
                        );

                    this.refresh();
                },
            );
        }

        return {
            node,
            graphics,
            label,
            value,
            supported,
        };
    }

    private createVolumeRow(
        parent: Node,
        key:
            | 'master'
            | 'bgm'
            | 'sfx',
        title: string,
        y: number,
    ): VolumeRowVisual {
        this.createLabel(
            parent,
            `${key}_Title`,
            title,
            -205,
            y,
            20,
            120,
            34,
            new Color(
                71,
                75,
                70,
                255,
            ),
        );

        const minus =
            this.createActionButton(
                parent,
                `${key}_Minus`,
                '−',
                -82,
                y,
                46,
                46,
            );

        const plus =
            this.createActionButton(
                parent,
                `${key}_Plus`,
                '+',
                215,
                y,
                46,
                46,
            );

        const barNode =
            new Node(
                `${key}_Bar`,
            );

        barNode.layer =
            Layers.Enum.UI_2D;
        parent.addChild(barNode);
        barNode.setPosition(
            65,
            y,
            0,
        );
        barNode.addComponent(
            UITransform,
        ).setContentSize(
            220,
            38,
        );

        const bar =
            barNode.addComponent(
                Graphics,
            );

        const percentLabel =
            this.createLabel(
                barNode,
                'Percent',
                '',
                0,
                0,
                16,
                120,
                30,
                new Color(
                    75,
                    78,
                    72,
                    255,
                ),
            );

        minus.on(
            Node.EventType.TOUCH_END,
            () => {
                this.adjustVolume(
                    key,
                    -0.1,
                );
            },
        );

        plus.on(
            Node.EventType.TOUCH_END,
            () => {
                this.adjustVolume(
                    key,
                    0.1,
                );
            },
        );

        return {
            key,
            bar,
            percentLabel,
        };
    }

    private adjustVolume(
        key:
            | 'master'
            | 'bgm'
            | 'sfx',
        delta: number,
    ): void {
        const settings =
            GameAudioSettings
                .getSnapshot();

        if (
            key === 'master'
        ) {
            GameAudioSettings
                .setMasterVolume(
                    settings
                        .masterVolume +
                    delta,
                );
        } else if (
            key === 'bgm'
        ) {
            GameAudioSettings
                .setBgmVolume(
                    settings.bgmVolume +
                    delta,
                );
        } else {
            GameAudioSettings
                .setSfxVolume(
                    settings.sfxVolume +
                    delta,
                );
        }

        AudioManager.refreshVolumes();
        AudioManager.playUi(
            'ui_click',
            {
                minIntervalMs: 45,
                throttleKey:
                    `volume_${key}`,
            },
        );

        this.refresh();
    }

    private refresh(): void {
        const preferred =
            GamePerformanceSettings
                .getPreferredFrameRate();

        const applied =
            GamePerformanceSettings
                .getAppliedFrameRate();

        for (
            const button
            of this.frameButtons
        ) {
            const selected =
                button.supported &&
                button.value ===
                    applied;

            button.graphics.clear();

            button.graphics.fillColor =
                !button.supported
                    ? new Color(
                        215,
                        213,
                        202,
                        255,
                    )
                    : selected
                        ? new Color(
                            105,
                            179,
                            112,
                            255,
                        )
                        : new Color(
                            241,
                            233,
                            208,
                            255,
                        );

            button.graphics.roundRect(
                -71,
                -36,
                142,
                72,
                18,
            );

            button.graphics.fill();

            button.graphics.strokeColor =
                selected
                    ? new Color(
                        67,
                        131,
                        75,
                        255,
                    )
                    : new Color(
                        195,
                        174,
                        127,
                        255,
                    );

            button.graphics.lineWidth =
                selected
                    ? 4
                    : 2;

            button.graphics.roundRect(
                -71,
                -36,
                142,
                72,
                18,
            );

            button.graphics.stroke();

            button.label.color =
                !button.supported
                    ? new Color(
                        145,
                        145,
                        138,
                        255,
                    )
                    : selected
                        ? new Color(
                            255,
                            255,
                            246,
                            255,
                        )
                        : new Color(
                            65,
                            70,
                            67,
                            255,
                        );
        }

        if (
            preferred !== applied
        ) {
            this.statusLabel.string =
                `已选择 ${preferred} FPS · 当前平台实际 ${applied} FPS`;
        } else {
            this.statusLabel.string =
                `当前目标：${applied} FPS`;
        }

        const audio =
            GameAudioSettings
                .getSnapshot();

        for (
            const row
            of this.volumeRows
        ) {
            const value =
                row.key === 'master'
                    ? audio.masterVolume
                    : row.key === 'bgm'
                        ? audio.bgmVolume
                        : audio.sfxVolume;

            row.bar.clear();
            row.bar.fillColor =
                new Color(
                    220,
                    215,
                    194,
                    255,
                );
            row.bar.roundRect(
                -110,
                -11,
                220,
                22,
                11,
            );
            row.bar.fill();

            const width =
                220 * value;

            if (width > 0) {
                row.bar.fillColor =
                    new Color(
                        104,
                        169,
                        111,
                        255,
                    );
                row.bar.roundRect(
                    -110,
                    -11,
                    width,
                    22,
                    11,
                );
                row.bar.fill();
            }

            row.percentLabel.string =
                `${Math.round(
                    value * 100,
                )}%`;
        }

        this.muteGraphics.clear();
        this.muteGraphics.fillColor =
            audio.muted
                ? new Color(
                    164,
                    92,
                    79,
                    255,
                )
                : new Color(
                    75,
                    120,
                    91,
                    255,
                );
        this.muteGraphics.roundRect(
            -115,
            -29,
            230,
            58,
            16,
        );
        this.muteGraphics.fill();

        this.muteLabel.string =
            audio.muted
                ? '声音：已静音'
                : '声音：开启';
    }

    private createActionButton(
        parent: Node,
        name: string,
        text: string,
        x: number,
        y: number,
        width: number,
        height: number,
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
            width,
            height,
        );

        const g =
            node.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                75,
                120,
                91,
                255,
            );

        g.roundRect(
            -width / 2,
            -height / 2,
            width,
            height,
            Math.min(
                16,
                height / 2,
            ),
        );

        g.fill();

        this.createLabel(
            node,
            'Text',
            text,
            0,
            0,
            height <= 48
                ? 24
                : 22,
            width - 8,
            Math.max(
                30,
                height - 8,
            ),
            new Color(
                255,
                255,
                245,
                255,
            ),
        );

        return node;
    }

    private createLabel(
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
            fontSize + 6;
        label.color = color;
        label.horizontalAlign =
            Label.HorizontalAlign.CENTER;
        label.verticalAlign =
            Label.VerticalAlign.CENTER;

        return label;
    }
}
