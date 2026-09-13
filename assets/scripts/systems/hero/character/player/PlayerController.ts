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
import {
    HERO_BASE_MOVE_SPEED,
} from '../../profession/definition/ProfessionTypes';

const { ccclass, property } = _decorator;

/**
 * 历史兼容组件。
 * v0.6.6 起 MainHeroController 是玩家移动唯一 Runtime；
 * 这里不再读取摇杆或写入角色坐标，避免第二套 moveSpeed 逻辑回归。
 */
@ccclass('PlayerController')
export class PlayerController extends Component {
    @property
    moveSpeed = HERO_BASE_MOVE_SPEED;

    @property
    minX = -320;

    @property
    maxX = 320;

    @property
    minY = -430;

    @property
    maxY = 430;

    /** 玩家移动由 MainHeroController 唯一负责。 */

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
