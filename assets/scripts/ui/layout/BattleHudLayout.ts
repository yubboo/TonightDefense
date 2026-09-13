/**
 * @architecture TonightDefense V1.0
 * @owner ui
 * @module layout
 *
 * Battle HUD 屏幕布局唯一事实源。
 *
 * 设计坐标仍然以 720 × 1280 为基准；长屏/刘海屏只改变“屏幕边缘锚点”，
 * 不去缩放 HUD 本身，也不影响 BattleWorldRoot 的战场坐标。
 */
import {
    Rect,
    sys,
    view as cocosView,
} from 'cc';

export interface BattleHudMetrics {
    visibleWidth: number;
    visibleHeight: number;
    visibleLeft: number;
    visibleRight: number;
    visibleTop: number;
    visibleBottom: number;
    safeLeft: number;
    safeRight: number;
    safeTop: number;
    safeBottom: number;
    safeCenterX: number;
    safeCenterY: number;
}

export class BattleHudLayout {
    static readonly DESIGN_WIDTH = 720;

    static readonly DESIGN_HEIGHT = 1280;

    static readonly DESIGN_HALF_WIDTH =
        BattleHudLayout.DESIGN_WIDTH * 0.5;

    static readonly DESIGN_HALF_HEIGHT =
        BattleHudLayout.DESIGN_HEIGHT * 0.5;

    static getMetrics(): BattleHudMetrics {
        const visibleSize =
            cocosView.getVisibleSize();

        const visibleOrigin =
            cocosView.getVisibleOrigin();

        const width =
            Number.isFinite(visibleSize.width) &&
            visibleSize.width > 0
                ? visibleSize.width
                : BattleHudLayout.DESIGN_WIDTH;

        const height =
            Number.isFinite(visibleSize.height) &&
            visibleSize.height > 0
                ? visibleSize.height
                : BattleHudLayout.DESIGN_HEIGHT;

        const visibleLeft =
            -width * 0.5;
        const visibleBottom =
            -height * 0.5;
        const visibleRight =
            width * 0.5;
        const visibleTop =
            height * 0.5;

        let safeRect:
            Rect | null = null;

        try {
            safeRect =
                sys.getSafeAreaRect(
                    true,
                );
        } catch {
            safeRect = null;
        }

        if (
            !safeRect ||
            !Number.isFinite(safeRect.x) ||
            !Number.isFinite(safeRect.y) ||
            !Number.isFinite(safeRect.width) ||
            !Number.isFinite(safeRect.height) ||
            safeRect.width <= 0 ||
            safeRect.height <= 0
        ) {
            return {
                visibleWidth: width,
                visibleHeight: height,
                visibleLeft,
                visibleRight,
                visibleTop,
                visibleBottom,
                safeLeft: visibleLeft,
                safeRight: visibleRight,
                safeTop: visibleTop,
                safeBottom: visibleBottom,
                safeCenterX: 0,
                safeCenterY: 0,
            };
        }

        /**
         * sys.getSafeAreaRect() / getVisibleOrigin() 使用左下角视图坐标，
         * Canvas 子节点使用屏幕中心为 0 的局部坐标；这里统一换算一次。
         */
        const originX =
            Number.isFinite(visibleOrigin.x)
                ? visibleOrigin.x
                : 0;
        const originY =
            Number.isFinite(visibleOrigin.y)
                ? visibleOrigin.y
                : 0;

        const safeLeft =
            safeRect.x -
            originX -
            width * 0.5;

        const safeBottom =
            safeRect.y -
            originY -
            height * 0.5;

        const safeRight =
            safeLeft +
            safeRect.width;

        const safeTop =
            safeBottom +
            safeRect.height;

        return {
            visibleWidth: width,
            visibleHeight: height,
            visibleLeft,
            visibleRight,
            visibleTop,
            visibleBottom,
            safeLeft,
            safeRight,
            safeTop,
            safeBottom,
            safeCenterX:
                (safeLeft + safeRight) * 0.5,
            safeCenterY:
                (safeBottom + safeTop) * 0.5,
        };
    }

    /** 保留设计稿到“顶部边缘”的距离，改为锚定真实安全区顶部。 */
    static topAnchoredY(
        designY: number,
    ): number {
        const metrics =
            this.getMetrics();

        return designY +
            (
                metrics.safeTop -
                this.DESIGN_HALF_HEIGHT
            );
    }

    /** 保留设计稿到“底部边缘”的距离，改为锚定真实安全区底部。 */
    static bottomAnchoredY(
        designY: number,
    ): number {
        const metrics =
            this.getMetrics();

        return designY +
            (
                metrics.safeBottom +
                this.DESIGN_HALF_HEIGHT
            );
    }

    /** 保留设计稿到左边缘的距离，兼容未来横屏/异形屏安全区。 */
    static leftAnchoredX(
        designX: number,
    ): number {
        const metrics =
            this.getMetrics();

        return designX +
            (
                metrics.safeLeft +
                this.DESIGN_HALF_WIDTH
            );
    }

    /** 保留设计稿到右边缘的距离。 */
    static rightAnchoredX(
        designX: number,
    ): number {
        const metrics =
            this.getMetrics();

        return designX +
            (
                metrics.safeRight -
                this.DESIGN_HALF_WIDTH
            );
    }
}
