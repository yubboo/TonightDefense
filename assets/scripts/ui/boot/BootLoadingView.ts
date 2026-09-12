import {
    BlockInputEvents,
    Color,
    Graphics,
    Label,
    Layers,
    Node,
    resources,
    Sprite,
    SpriteFrame,
    tween,
    UIOpacity,
    UITransform,
    Vec3,
} from 'cc';

/**
 * 启动加载层。
 *
 * 不单独创建 Scene，直接覆盖在 MainMenu.scene 上：
 * 1. 避免再维护第三个场景序列化文件。
 * 2. 启动阶段不会先闪旧大厅。
 * 3. 登录完成后再真正构建 MainMenuView。
 */
export class BootLoadingView {
    private readonly canvas:
        Node;

    private readonly root:
        Node;

    private readonly status:
        Label;

    private readonly percent:
        Label;

    private readonly progressFill:
        Node;

    private progress =
        0;

    private retryButton:
        Node | null =
        null;

    private readonly fit =
        (): void => {
            const size =
                this.canvas
                    .getComponent(
                        UITransform,
                    )
                    ?.contentSize;

            if (
                !size ||
                !this.root.isValid
            ) {
                return;
            }

            let scale =
                size.width /
                720;

            let visibleHeight =
                size.height /
                scale;

            if (
                visibleHeight <
                1280
            ) {
                scale =
                    size.height /
                    1280;
            }

            this.root.setScale(
                scale,
                scale,
                1,
            );
        };

    constructor(
        canvas:
            Node,
    ) {
        this.canvas =
            canvas;

        this.root =
            this.createNode(
                canvas,
                'BootLoadingLayer',
                720,
                1280,
            );

        this.root.addComponent(
            BlockInputEvents,
        );

        const background =
            this.root.addComponent(
                Graphics,
            );

        background.fillColor =
            new Color(
                151,
                205,
                239,
                255,
            );

        background.rect(
            -360,
            -640,
            720,
            1280,
        );

        background.fill();

        const art =
            this.createNode(
                this.root,
                'LaunchArt',
                720,
                720,
                0,
                160,
            );

        const sprite =
            art.addComponent(
                Sprite,
            );

        resources.load(
            'ui/boot/launch-art/spriteFrame',
            SpriteFrame,
            (
                error,
                frame,
            ) => {
                if (
                    error ||
                    !art.isValid
                ) {
                    console.warn(
                        '[启动] 启动图加载失败',
                        error,
                    );
                    return;
                }

                sprite.spriteFrame =
                    frame;
                sprite.sizeMode =
                    Sprite.SizeMode.CUSTOM;
            },
        );

        this.status =
            this.createLabel(
                this.root,
                'Status',
                '正在启动今晚守城…',
                0,
                -292,
                25,
                570,
                new Color(
                    34,
                    54,
                    63,
                    255,
                ),
            );

        const bar =
            this.createNode(
                this.root,
                'ProgressBar',
                510,
                28,
                0,
                -350,
            );

        const bg =
            bar.addComponent(
                Graphics,
            );

        bg.fillColor =
            new Color(
                35,
                57,
                62,
                220,
            );

        bg.roundRect(
            -255,
            -14,
            510,
            28,
            14,
        );

        bg.fill();

        this.progressFill =
            this.createNode(
                bar,
                'Fill',
                486,
                14,
                -243,
                0,
            );

        this.progressFill
            .getComponent(
                UITransform,
            )!
            .anchorX =
            0;

        this.progressFill
            .getComponent(
                UITransform,
            )!
            .setContentSize(
                486,
                14,
            );

        const fg =
            this.progressFill
                .addComponent(
                    Graphics,
                );

        fg.fillColor =
            new Color(
                61,
                183,
                86,
                255,
            );

        fg.roundRect(
            0,
            -7,
            486,
            14,
            7,
        );

        fg.fill();

        this.progressFill.setScale(
            0.001,
            1,
            1,
        );

        this.percent =
            this.createLabel(
                this.root,
                'Percent',
                '0%',
                0,
                -390,
                18,
                160,
                new Color(
                    45,
                    61,
                    64,
                    255,
                ),
            );

        this.createLabel(
            this.root,
            'Hint',
            '守护雕像，坚守四十波！',
            0,
            -470,
            18,
            500,
            new Color(
                66,
                82,
                82,
                230,
            ),
        );

        this.fit();

        this.canvas.on(
            Node.EventType
                .SIZE_CHANGED,
            this.fit,
        );
    }

    setProgress(
        value:
            number,
        message:
            string,
    ): void {
        this.progress =
            Math.max(
                this.progress,
                Math.min(
                    1,
                    value,
                ),
            );

        this.status.string =
            message;

        this.percent.string =
            `${Math.round(
                this.progress *
                100,
            )}%`;

        tween(
            this.progressFill,
        )
            .to(
                0.18,
                {
                    scale:
                        new Vec3(
                            Math.max(
                                0.001,
                                this.progress,
                            ),
                            1,
                            1,
                        ),
                },
            )
            .start();
    }

    showError(
        message:
            string,
        onRetry:
            () => void,
    ): void {
        this.status.string =
            message;

        if (
            this.retryButton?.isValid
        ) {
            return;
        }

        const button =
            this.createNode(
                this.root,
                'RetryButton',
                240,
                70,
                0,
                -545,
            );

        this.retryButton =
            button;

        const g =
            button.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                242,
                187,
                63,
                255,
            );

        g.roundRect(
            -120,
            -35,
            240,
            70,
            18,
        );

        g.fill();

        g.strokeColor =
            new Color(
                63,
                51,
                32,
                255,
            );

        g.lineWidth = 4;
        g.roundRect(
            -116,
            -31,
            232,
            62,
            16,
        );
        g.stroke();

        this.createLabel(
            button,
            'Text',
            '重新连接',
            0,
            0,
            25,
            200,
            new Color(
                52,
                45,
                34,
                255,
            ),
        );

        button.on(
            Node.EventType
                .TOUCH_END,
            () => {
                button.destroy();
                this.retryButton =
                    null;
                onRetry();
            },
        );
    }

    async finish():
        Promise<void> {
        this.setProgress(
            1,
            '准备完成，进入城堡…',
        );

        await new Promise<void>(
            (
                resolve,
            ) => {
                setTimeout(
                    resolve,
                    180,
                );
            },
        );

        if (
            !this.root.isValid
        ) {
            return;
        }

        const opacity =
            this.root.addComponent(
                UIOpacity,
            );

        opacity.opacity =
            255;

        await new Promise<void>(
            (
                resolve,
            ) => {
                tween(
                    opacity,
                )
                    .to(
                        0.22,
                        {
                            opacity: 0,
                        },
                    )
                    .call(
                        resolve,
                    )
                    .start();
            },
        );

        this.destroy();
    }

    destroy(): void {
        this.canvas.off(
            Node.EventType
                .SIZE_CHANGED,
            this.fit,
        );

        if (
            this.root.isValid
        ) {
            this.root.destroy();
        }
    }

    private createNode(
        parent:
            Node,
        name:
            string,
        width:
            number,
        height:
            number,
        x = 0,
        y = 0,
    ): Node {
        const node =
            new Node(
                name,
            );

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
        )
            .setContentSize(
                width,
                height,
            );

        return node;
    }

    private createLabel(
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
        color:
            Color,
    ): Label {
        const node =
            this.createNode(
                parent,
                name,
                width,
                fontSize *
                    2.2,
                x,
                y,
            );

        const label =
            node.addComponent(
                Label,
            );

        label.string =
            text;
        label.fontSize =
            fontSize;
        label.lineHeight =
            fontSize + 6;
        label.color =
            color;
        label.overflow =
            Label.Overflow.SHRINK;

        return label;
    }
}
