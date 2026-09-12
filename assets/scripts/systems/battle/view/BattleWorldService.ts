/**
 * @architecture TonightDefense V1.0
 * @owner battle
 * @module view
 *
 * 战斗世界根节点唯一入口。
 *
 * 当前 Battle.scene 仍然使用同一个 Canvas 承载战斗世界和屏幕 UI。
 * 为了做到“世界跟随镜头移动 / HUD 永远固定”，所有世界对象必须统一挂到
 * BattleWorldRoot；HUD、弹窗、摇杆继续直接挂 Canvas。
 */
import {
    Layers,
    Node,
    UITransform,
} from 'cc';

import {
    BATTLE_LAYOUT,
} from '../data/BattleLayoutConfig';

export class BattleWorldService {
    private static worldRootValue:
        Node | null = null;

    static ensure(
        canvas: Node,
    ): Node {
        const cached =
            this.worldRootValue;

        if (
            cached &&
            cached.isValid &&
            cached.parent === canvas
        ) {
            return cached;
        }

        const existing =
            canvas.getChildByName(
                'BattleWorldRoot',
            );

        if (
            existing &&
            existing.isValid
        ) {
            this.worldRootValue =
                existing;
            this.applyBaseTransform(
                existing,
            );
            return existing;
        }

        const root =
            new Node(
                'BattleWorldRoot',
            );

        root.layer =
            Layers.Enum.UI_2D;

        canvas.addChild(root);
        root.setSiblingIndex(0);

        root.addComponent(
            UITransform,
        ).setContentSize(
            BATTLE_LAYOUT.map.width,
            BATTLE_LAYOUT.map.height,
        );

        this.worldRootValue =
            root;

        this.applyBaseTransform(
            root,
        );

        return root;
    }

    static get(
        canvas: Node,
    ): Node {
        return this.ensure(
            canvas,
        );
    }

    static reset(): void {
        this.worldRootValue =
            null;
    }

    private static applyBaseTransform(
        root: Node,
    ): void {
        const scale =
            BATTLE_LAYOUT.view.worldScale;

        /**
         * 热重载或版本切换后也强制同步世界尺寸，避免沿用 v0.4.8 无限地图
         * 留下的旧 UITransform 尺寸影响有限地图边界判断与预览。
         */
        const transform =
            root.getComponent(
                UITransform,
            ) ??
            root.addComponent(
                UITransform,
            );

        transform.setContentSize(
            BATTLE_LAYOUT.map.width,
            BATTLE_LAYOUT.map.height,
        );

        root.setScale(
            scale,
            scale,
            1,
        );
    }
}
