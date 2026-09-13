/**
 * @architecture TonightDefense V1.0
 * @owner ui
 * @module input
 * @migratedFrom player/VirtualJoystick.ts
 */
import {
    _decorator,
    Color,
    Component,
    EventKeyboard,
    EventTouch,
    Graphics,
    input,
    Input,
    KeyCode,
    Layers,
    Node,
    UITransform,
    Vec2,
    Vec3,
} from 'cc';
import { MoveInputState } from './MoveInputState';

import {
    BattleHudLayout,
} from '../layout/BattleHudLayout';

const { ccclass, property } = _decorator;

/**
 * 《今晚守城》
 * 功能：虚拟摇杆输入
 *
 * 微信开发者工具会把鼠标拖动转换成非常高频的 TOUCH_MOVE。
 * 旧实现会在每一个事件里做坐标转换、开方、节点 setPosition，
 * 事件频率高于渲染帧率时会把主线程占满，表现为角色移动时掉帧、闪烁、瞬移。
 *
 * 当前实现只在触摸事件里记录“最新坐标”，真正的摇杆计算最多每渲染帧一次。
 * 这样既保留跟手性，也不会让事件洪峰拖垮微信小游戏主线程。
 */
@ccclass('VirtualJoystick')
export class VirtualJoystick extends Component {
    @property
    radius = 78;

    @property
    knobRadius = 34;

    @property
    posX = -245;

    @property
    posY = -455;

    @property
    deadZone = 0.10;

    private joystickRoot: Node | null = null;
    private knob: Node | null = null;
    private uiTransform: UITransform | null = null;

    private readonly heldKeys = new Set<KeyCode>();
    private readonly keyboardDirection = new Vec2();
    private readonly touchDirection = new Vec2();

    /** 触摸事件只写这里；坐标转换由 update() 一帧最多执行一次。 */
    private readonly pendingTouchUiPoint = new Vec2();
    private readonly touchWorldPoint = new Vec3();
    private readonly touchLocalPoint = new Vec3();

    private touching = false;
    private touchPointDirty = false;

    private layoutRefreshTimer = 0;

    start(): void {
        this.createJoystick();

        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);

        console.log('[今晚守城] 虚拟摇杆已启动（微信触摸限频版）');
    }

    update(dt: number): void {
        this.layoutRefreshTimer -= dt;

        if (
            this.layoutRefreshTimer <= 0
        ) {
            this.layoutRefreshTimer = 0.25;
            this.refreshLayout();
        }

        this.updateKeyboardDirection();

        if (this.touching) {
            if (this.touchPointDirty) {
                this.consumeLatestTouchPoint();
            }

            MoveInputState.set(
                this.touchDirection.x,
                this.touchDirection.y,
            );
            return;
        }

        MoveInputState.set(
            this.keyboardDirection.x,
            this.keyboardDirection.y,
        );
    }

    onDestroy(): void {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);

        this.unregisterTouchEvents();

        this.heldKeys.clear();
        MoveInputState.clear();
    }

    private createJoystick(): void {
        const canvas = this.node.parent;

        if (!canvas) {
            console.error('[今晚守城] VirtualJoystick 找不到 Canvas');
            return;
        }

        const old = canvas.getChildByName('VirtualJoystickUI');

        if (old) {
            old.destroy();
        }

        const root = new Node('VirtualJoystickUI');
        root.layer = Layers.Enum.UI_2D;

        canvas.addChild(root);

        root.setPosition(
            BattleHudLayout.leftAnchoredX(
                this.posX,
            ),
            BattleHudLayout.bottomAnchoredY(
                this.posY,
            ),
            0,
        );

        const transform = root.addComponent(UITransform);
        transform.setContentSize(
            this.radius * 2.6,
            this.radius * 2.6,
        );

        this.uiTransform = transform;

        this.drawBase(root);

        const knob = new Node('Knob');
        knob.layer = Layers.Enum.UI_2D;

        root.addChild(knob);
        knob.setPosition(0, 0, 0);

        knob.addComponent(UITransform).setContentSize(
            this.knobRadius * 2,
            this.knobRadius * 2,
        );

        this.drawKnob(knob);

        this.joystickRoot = root;
        this.knob = knob;

        this.registerTouchEvents();
    }


    private refreshLayout(): void {
        const root =
            this.joystickRoot;

        if (
            !root ||
            !root.isValid
        ) {
            return;
        }

        root.setPosition(
            BattleHudLayout.leftAnchoredX(
                this.posX,
            ),
            BattleHudLayout.bottomAnchoredY(
                this.posY,
            ),
            0,
        );
    }

    private drawBase(root: Node): void {
        const g = root.addComponent(Graphics);

        g.fillColor = new Color(33, 40, 45, 92);
        g.circle(0, 0, this.radius + 6);
        g.fill();

        g.fillColor = new Color(43, 49, 54, 120);
        g.circle(0, 0, this.radius);
        g.fill();

        g.fillColor = new Color(255, 255, 255, 26);
        g.circle(0, this.radius * 0.12, this.radius * 0.74);
        g.fill();

        g.strokeColor = new Color(255, 255, 255, 128);
        g.lineWidth = 3;
        g.circle(0, 0, this.radius);
        g.stroke();

        g.strokeColor = new Color(115, 214, 236, 105);
        g.lineWidth = 2;
        g.circle(0, 0, this.radius * 0.58);
        g.stroke();

        g.strokeColor = new Color(255, 255, 255, 70);
        g.lineWidth = 2.5;

        g.moveTo(-this.radius * 0.72, 0);
        g.lineTo(-this.radius * 0.48, 0);

        g.moveTo(this.radius * 0.48, 0);
        g.lineTo(this.radius * 0.72, 0);

        g.moveTo(0, -this.radius * 0.72);
        g.lineTo(0, -this.radius * 0.48);

        g.moveTo(0, this.radius * 0.72);
        g.lineTo(0, this.radius * 0.48);

        g.stroke();
    }

    private drawKnob(knob: Node): void {
        const g = knob.addComponent(Graphics);

        g.fillColor = new Color(247, 248, 246, 225);
        g.circle(0, 0, this.knobRadius + 2);
        g.fill();

        g.fillColor = new Color(255, 255, 255, 108);
        g.circle(0, 5, this.knobRadius * 0.56);
        g.fill();

        g.strokeColor = new Color(58, 66, 73, 175);
        g.lineWidth = 3;
        g.circle(0, 0, this.knobRadius + 1);
        g.stroke();

        g.fillColor = new Color(102, 210, 232, 255);
        g.circle(0, 0, 8);
        g.fill();

        g.strokeColor = new Color(235, 251, 255, 160);
        g.lineWidth = 2;
        g.circle(0, 0, 5);
        g.stroke();
    }

    private registerTouchEvents(): void {
        if (!this.joystickRoot) {
            return;
        }

        this.joystickRoot.on(
            Node.EventType.TOUCH_START,
            this.onTouchStart,
            this,
        );

        this.joystickRoot.on(
            Node.EventType.TOUCH_MOVE,
            this.onTouchMove,
            this,
        );

        this.joystickRoot.on(
            Node.EventType.TOUCH_END,
            this.onTouchEnd,
            this,
        );

        this.joystickRoot.on(
            Node.EventType.TOUCH_CANCEL,
            this.onTouchEnd,
            this,
        );
    }

    private unregisterTouchEvents(): void {
        if (!this.joystickRoot) {
            return;
        }

        this.joystickRoot.off(
            Node.EventType.TOUCH_START,
            this.onTouchStart,
            this,
        );

        this.joystickRoot.off(
            Node.EventType.TOUCH_MOVE,
            this.onTouchMove,
            this,
        );

        this.joystickRoot.off(
            Node.EventType.TOUCH_END,
            this.onTouchEnd,
            this,
        );

        this.joystickRoot.off(
            Node.EventType.TOUCH_CANCEL,
            this.onTouchEnd,
            this,
        );
    }

    private onTouchStart(event: EventTouch): void {
        this.touching = true;
        this.captureTouchPoint(event);

        /** 首次按下立即算一次，避免首帧空档；之后 TOUCH_MOVE 都由 update 限频。 */
        this.consumeLatestTouchPoint();
        MoveInputState.set(
            this.touchDirection.x,
            this.touchDirection.y,
        );
    }

    private onTouchMove(event: EventTouch): void {
        if (!this.touching) {
            return;
        }

        this.captureTouchPoint(event);
    }

    private onTouchEnd(): void {
        this.touching = false;
        this.touchPointDirty = false;
        this.touchDirection.set(0, 0);

        if (this.knob) {
            this.knob.setPosition(0, 0, 0);
        }

        MoveInputState.clear();
    }

    /**
     * 高频事件路径：只复制两个数字，不做 UITransform 转换、不动节点。
     */
    private captureTouchPoint(event: EventTouch): void {
        event.getUILocation(this.pendingTouchUiPoint);
        this.touchPointDirty = true;
    }

    /**
     * 一帧最多执行一次的真正摇杆计算。
     */
    private consumeLatestTouchPoint(): void {
        if (
            !this.touchPointDirty ||
            !this.uiTransform ||
            !this.knob
        ) {
            return;
        }

        this.touchPointDirty = false;

        this.touchWorldPoint.set(
            this.pendingTouchUiPoint.x,
            this.pendingTouchUiPoint.y,
            0,
        );

        this.uiTransform.convertToNodeSpaceAR(
            this.touchWorldPoint,
            this.touchLocalPoint,
        );

        let dx = this.touchLocalPoint.x;
        let dy = this.touchLocalPoint.y;

        let lengthSq = dx * dx + dy * dy;
        const radiusSq = this.radius * this.radius;

        if (lengthSq > radiusSq && lengthSq > 0) {
            const length = Math.sqrt(lengthSq);
            const scale = this.radius / length;

            dx *= scale;
            dy *= scale;
            lengthSq = radiusSq;
        }

        this.knob.setPosition(dx, dy, 0);

        if (lengthSq <= 0.000001) {
            this.touchDirection.set(0, 0);
            return;
        }

        const length = Math.sqrt(lengthSq);
        const rawMagnitude = Math.min(1, length / this.radius);
        const deadZone = Math.max(0, Math.min(0.45, this.deadZone));

        if (rawMagnitude <= deadZone) {
            this.touchDirection.set(0, 0);
            return;
        }

        const remappedMagnitude =
            (rawMagnitude - deadZone) /
            Math.max(0.001, 1 - deadZone);

        const inverseLength = 1 / length;

        this.touchDirection.set(
            dx * inverseLength * remappedMagnitude,
            dy * inverseLength * remappedMagnitude,
        );
    }

    private onKeyDown(event: EventKeyboard): void {
        this.heldKeys.add(event.keyCode);
    }

    private onKeyUp(event: EventKeyboard): void {
        this.heldKeys.delete(event.keyCode);
    }

    private updateKeyboardDirection(): void {
        let x = 0;
        let y = 0;

        if (
            this.heldKeys.has(KeyCode.KEY_A) ||
            this.heldKeys.has(KeyCode.ARROW_LEFT)
        ) {
            x -= 1;
        }

        if (
            this.heldKeys.has(KeyCode.KEY_D) ||
            this.heldKeys.has(KeyCode.ARROW_RIGHT)
        ) {
            x += 1;
        }

        if (
            this.heldKeys.has(KeyCode.KEY_W) ||
            this.heldKeys.has(KeyCode.ARROW_UP)
        ) {
            y += 1;
        }

        if (
            this.heldKeys.has(KeyCode.KEY_S) ||
            this.heldKeys.has(KeyCode.ARROW_DOWN)
        ) {
            y -= 1;
        }

        this.keyboardDirection.set(x, y);

        if (this.keyboardDirection.lengthSqr() > 1) {
            this.keyboardDirection.normalize();
        }
    }
}
