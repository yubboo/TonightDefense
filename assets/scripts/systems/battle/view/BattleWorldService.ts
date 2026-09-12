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
    view as cocosView,
} from 'cc';

import {
    BATTLE_LAYOUT,
} from '../data/BattleLayoutConfig';

export class BattleWorldService {
    private static worldRootValue:
        Node | null = null;

    private static worldScaleValue =
        BATTLE_LAYOUT.view.worldScale;

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
            this.applyBaseTransform(
                cached,
            );
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

        this.worldScaleValue =
            BATTLE_LAYOUT.view.worldScale;
    }

    /**
     * v0.6.3：背景/玩法世界统一按当前真实可见视口做 cover。
     *
     * 900 × 1600 是正式战斗背景与逻辑地图共同使用的 9:16 基准。
     * 720 × 1280 时比例正好是 0.8；更长的手机会按高度放大，
     * 只裁掉左右树林出血，不再把“手机视口”缩成大背景中央的一块。
     */
    static refreshViewportScale(
        root?: Node | null,
    ): number {
        const target =
            root ??
            this.worldRootValue;

        const visibleSize =
            cocosView.getVisibleSize();

        const scaleX =
            visibleSize.width > 0
                ? visibleSize.width /
                    BATTLE_LAYOUT.map.width
                : 0;

        const scaleY =
            visibleSize.height > 0
                ? visibleSize.height /
                    BATTLE_LAYOUT.map.height
                : 0;

        const resolved =
            Number.isFinite(scaleX) &&
            Number.isFinite(scaleY) &&
            scaleX > 0 &&
            scaleY > 0
                ? Math.max(
                    scaleX,
                    scaleY,
                )
                : BATTLE_LAYOUT
                    .view
                    .worldScale;

        this.worldScaleValue =
            resolved;

        if (
            target &&
            target.isValid
        ) {
            target.setScale(
                resolved,
                resolved,
                1,
            );
        }

        return resolved;
    }

    static getWorldScale(
        root?: Node | null,
    ): number {
        if (
            root &&
            root.isValid &&
            Number.isFinite(root.scale.x) &&
            root.scale.x > 0
        ) {
            return root.scale.x;
        }

        return this.worldScaleValue;
    }

    private static applyBaseTransform(
        root: Node,
    ): void {
        /**
         * 热重载或版本切换后也强制同步世界尺寸，避免沿用旧地图尺寸
         * 影响有限地图边界判断与预览。
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

        this.refreshViewportScale(
            root,
        );
    }
}
