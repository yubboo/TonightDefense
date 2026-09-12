/**
 * @architecture TonightDefense V1.0
 * @owner battle
 * @module view
 *
 * 战斗镜头唯一控制器。
 *
 * 当前项目的战斗 UI 与战斗世界共用 Canvas。直接移动 Cocos Camera 会同时影响
 * HUD，因此这里采用“固定屏幕 Camera + 移动/缩放 BattleWorldRoot”的等价方案：
 * - 世界层被拉远；
 * - 主角移动时世界层反向平滑位移；
 * - HUD、摇杆、弹窗不跟随；
 * - 地图边缘做 clamp，避免露出黑边；
 * - 路线 B 中镜头向下最多回到出生基线，不会继续越过底部防守区。
 */
import {
    _decorator,
    Component,
    Node,
} from 'cc';

import {
    MainHeroController,
} from '../../character/player/MainHeroController';

import {
    BATTLE_LAYOUT,
} from '../data/BattleLayoutConfig';

import {
    BattleWorldService,
} from './BattleWorldService';

const {
    ccclass,
} = _decorator;

@ccclass('BattleCameraController')
export class BattleCameraController
extends Component {
    private canvas:
        Node | null = null;

    private worldRoot:
        Node | null = null;

    private currentX = 0;
    private currentY = 0;

    private initialized = false;

    start(): void {
        this.canvas =
            this.node.parent;

        if (!this.canvas) {
            console.error(
                '[今晚守城] BattleCameraController 找不到 Canvas',
            );
            return;
        }

        this.worldRoot =
            BattleWorldService.ensure(
                this.canvas,
            );

        this.resetView();
    }

    onDestroy(): void {
        this.canvas = null;
        this.worldRoot = null;
    }

    lateUpdate(
        dt: number,
    ): void {
        const root =
            this.worldRoot;

        if (
            !root ||
            !root.isValid
        ) {
            return;
        }

        const hero =
            MainHeroController
                .instance
                ?.targetNode;

        if (
            !hero ||
            !hero.isValid
        ) {
            return;
        }

        const view =
            BATTLE_LAYOUT.view;

        const scale =
            view.worldScale;

        const heroScreenX =
            this.currentX +
            hero.position.x *
                scale;

        const heroScreenY =
            this.currentY +
            hero.position.y *
                scale;

        let targetX =
            this.currentX;

        let targetY =
            this.currentY;

        const minScreenX =
            -view.deadZoneX;

        const maxScreenX =
            view.deadZoneX;

        if (
            heroScreenX <
            minScreenX
        ) {
            targetX +=
                minScreenX -
                heroScreenX;
        } else if (
            heroScreenX >
            maxScreenX
        ) {
            targetX -=
                heroScreenX -
                maxScreenX;
        }

        const minScreenY =
            view.heroScreenY -
            view.deadZoneY;

        const maxScreenY =
            view.heroScreenY +
            view.deadZoneY;

        /**
         * 路线 B：上行正常跟随；从上方返回时镜头可以回到出生基线，
         * 但 clampRootY 会阻止镜头继续向下越过底部锁定线。
         * 所以“在底部防守区继续往下走”不会再推动镜头。
         */
        if (
            heroScreenY <
            minScreenY
        ) {
            targetY +=
                minScreenY -
                heroScreenY;
        } else if (
            heroScreenY >
            maxScreenY
        ) {
            targetY -=
                heroScreenY -
                maxScreenY;
        }

        targetX =
            this.clampRootX(
                targetX,
            );

        targetY =
            this.clampRootY(
                targetY,
            );

        const safeDt =
            Math.max(
                0,
                Math.min(
                    dt,
                    1 / 30,
                ),
            );

        const alpha =
            1 -
            Math.exp(
                -view.followSharpness *
                safeDt,
            );

        this.currentX +=
            (
                targetX -
                this.currentX
            ) *
            alpha;

        this.currentY +=
            (
                targetY -
                this.currentY
            ) *
            alpha;

        root.setPosition(
            this.currentX,
            this.currentY,
            0,
        );
    }

    private resetView(): void {
        const view =
            BATTLE_LAYOUT.view;

        this.currentX = 0;

        /**
         * 把出生点放在预期的屏幕 Y，而不是假设出生点永远为 0。
         * 该值同时是路线 B 的“底部镜头锁定线”。
         */
        this.currentY =
            this.clampRootY(
                view.heroScreenY -
                BATTLE_LAYOUT
                    .heroSpawn
                    .y *
                    view.worldScale,
            );

        this.worldRoot
            ?.setPosition(
                this.currentX,
                this.currentY,
                0,
            );

        this.initialized = true;
    }

    private clampRootX(
        value: number,
    ): number {
        const map =
            BATTLE_LAYOUT.map;

        if (map.infinite) {
            return value;
        }

        const view =
            BATTLE_LAYOUT.view;

        const scaledHalfWidth =
            map.width *
            view.worldScale *
            0.5;

        const min =
            view.viewportHalfWidth -
            scaledHalfWidth;

        const max =
            -view.viewportHalfWidth +
            scaledHalfWidth;

        if (min > max) {
            return 0;
        }

        return Math.max(
            min,
            Math.min(
                max,
                value,
            ),
        );
    }

    private clampRootY(
        value: number,
    ): number {
        const map =
            BATTLE_LAYOUT.map;

        const view =
            BATTLE_LAYOUT.view;

        if (map.infinite) {
            return value;
        }

        const scaledHalfHeight =
            map.height *
            view.worldScale *
            0.5;

        /** 地图向上推进时世界根节点向下移动。 */
        const min =
            view.viewportHalfHeight -
            scaledHalfHeight;

        /**
         * 最大 Y 固定为出生镜头位置，因此向下走不会让镜头继续跟随。
         */
        const bottomLockY =
            view.heroScreenY -
            BATTLE_LAYOUT
                .heroSpawn
                .y *
                view.worldScale;

        const mapSafeMax =
            -view.viewportHalfHeight +
            scaledHalfHeight;

        const max =
            view.followDown
                ? mapSafeMax
                : Math.min(
                    bottomLockY,
                    mapSafeMax,
                );

        if (min > max) {
            return 0;
        }

        return Math.max(
            min,
            Math.min(
                max,
                value,
            ),
        );
    }
}
