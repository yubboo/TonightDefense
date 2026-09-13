/**
 * @architecture TonightDefense V1.0
 * @owner ui
 * @module hud
 *
 * 只显示 EnemyController 提供的 Boss 状态，不保存战斗状态。
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
    BattleHudLayout,
} from '../layout/BattleHudLayout';

export class BossHealthHUD {
    private readonly root:
        Node;

    private readonly fill:
        Node;

    private readonly phaseLabel:
        Label;

    private readonly healthLabel:
        Label;

    private readonly barWidth = 500;

    constructor(
        canvas: Node,
        displayName: string,
        title: string,
    ) {
        canvas.getChildByName(
            'BossHealthHUD',
        )?.destroy();

        const root =
            new Node(
                'BossHealthHUD',
            );

        root.layer =
            Layers.Enum.UI_2D;
        canvas.addChild(root);
        root.setPosition(
            0,
            BattleHudLayout.topAnchoredY(
                452,
            ),
            0,
        );
        root.addComponent(
            UITransform,
        ).setContentSize(
            610,
            92,
        );

        const bg =
            root.addComponent(
                Graphics,
            );

        bg.fillColor =
            new Color(
                40,
                20,
                23,
                238,
            );
        bg.roundRect(
            -305,
            -46,
            610,
            92,
            18,
        );
        bg.fill();

        bg.strokeColor =
            new Color(
                235,
                170,
                53,
                255,
            );
        bg.lineWidth = 3;
        bg.roundRect(
            -305,
            -46,
            610,
            92,
            18,
        );
        bg.stroke();

        this.createLabel(
            root,
            'BossName',
            `${displayName} · ${title}`,
            -160,
            22,
            310,
            28,
            24,
            new Color(
                255,
                229,
                177,
                255,
            ),
        );

        this.phaseLabel =
            this.createLabel(
                root,
                'BossPhase',
                '',
                205,
                22,
                150,
                24,
                17,
                new Color(
                    255,
                    177,
                    100,
                    255,
                ),
            );

        const track =
            new Node(
                'BossHealthTrack',
            );
        track.layer =
            Layers.Enum.UI_2D;
        root.addChild(track);
        track.setPosition(0, -17, 0);
        track.addComponent(
            UITransform,
        ).setContentSize(
            this.barWidth,
            24,
        );

        const trackGraphics =
            track.addComponent(
                Graphics,
            );
        trackGraphics.fillColor =
            new Color(
                20,
                16,
                18,
                255,
            );
        trackGraphics.roundRect(
            -this.barWidth / 2,
            -10,
            this.barWidth,
            20,
            10,
        );
        trackGraphics.fill();

        const fill =
            new Node(
                'BossHealthFill',
            );
        fill.layer =
            Layers.Enum.UI_2D;
        track.addChild(fill);
        fill.setPosition(
            -this.barWidth / 2 + 3,
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
            this.barWidth - 6,
            14,
        );

        const fillGraphics =
            fill.addComponent(
                Graphics,
            );
        fillGraphics.fillColor =
            new Color(
                220,
                55,
                38,
                255,
            );
        fillGraphics.roundRect(
            0,
            -7,
            this.barWidth - 6,
            14,
            7,
        );
        fillGraphics.fill();

        this.healthLabel =
            this.createLabel(
                track,
                'BossHealthText',
                '',
                0,
                0,
                260,
                22,
                14,
                new Color(
                    255,
                    245,
                    224,
                    255,
                ),
            );

        this.root = root;
        this.fill = fill;
    }

    update(
        hp: number,
        maxHp: number,
        phaseNumber: number,
        phaseName: string,
    ): void {
        this.refreshLayout();

        const ratio =
            Math.max(
                0,
                Math.min(
                    1,
                    maxHp > 0
                        ? hp / maxHp
                        : 0,
                ),
            );

        this.fill.setScale(
            ratio,
            1,
            1,
        );

        this.phaseLabel.string =
            `阶段${phaseNumber} · ${phaseName}`;

        this.healthLabel.string =
            `${Math.ceil(hp)} / ${Math.ceil(maxHp)}`;
    }


    refreshLayout(): void {
        if (!this.root.isValid) {
            return;
        }

        const metrics =
            BattleHudLayout.getMetrics();

        this.root.setPosition(
            metrics.safeCenterX,
            BattleHudLayout.topAnchoredY(
                452,
            ),
            0,
        );
    }

    destroy(): void {
        if (this.root.isValid) {
            this.root.destroy();
        }
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
        node.setPosition(x, y, 0);
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
            fontSize + 5;
        label.color = color;
        label.overflow =
            Label.Overflow.SHRINK;

        return label;
    }
}
