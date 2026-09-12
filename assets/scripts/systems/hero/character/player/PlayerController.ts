/**
 * @architecture TonightDefense V1.0
 * @owner character
 * @module player
 * @migratedFrom player/PlayerController.ts
 */
import {
    _decorator,
    Color,
    Component,
    Graphics,
    Node,
    UITransform,
} from 'cc';
import { MoveInputState } from '../../../../ui/input/MoveInputState';

const { ccclass, property } = _decorator;

@ccclass('PlayerController')
export class PlayerController extends Component {
    @property
    moveSpeed = 300;

    @property
    minX = -320;

    @property
    maxX = 320;

    @property
    minY = -430;

    @property
    maxY = 430;

    update(dt: number): void {
        const dir = MoveInputState.direction;

        if (dir.lengthSqr() <= 0.0001) {
            return;
        }

        const pos = this.node.position;

        const nextX = Math.max(
            this.minX,
            Math.min(this.maxX, pos.x + dir.x * this.moveSpeed * dt),
        );

        const nextY = Math.max(
            this.minY,
            Math.min(this.maxY, pos.y + dir.y * this.moveSpeed * dt),
        );

        this.node.setPosition(nextX, nextY, pos.z);
    }

    static drawDebugVisual(node: Node): void {
        node.getComponent(UITransform)?.setContentSize(100, 100);

        const g = node.getComponent(Graphics) ?? node.addComponent(Graphics);
        g.clear();

        g.fillColor = new Color(45, 119, 255, 255);
        g.circle(0, 0, 38);
        g.fill();

        g.fillColor = new Color(23, 58, 143, 255);
        g.moveTo(-42, 18);
        g.lineTo(0, 72);
        g.lineTo(42, 18);
        g.close();
        g.fill();

        g.fillColor = new Color(255, 214, 90, 255);
        g.circle(0, 4, 10);
        g.fill();
    }
}
