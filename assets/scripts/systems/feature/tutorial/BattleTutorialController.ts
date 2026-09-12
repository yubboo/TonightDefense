import {
    _decorator,
    Color,
    Component,
    Graphics,
    Label,
    Layers,
    Node,
    sys,
    UITransform,
} from 'cc';

import {
    HeroSelectionState,
} from '../../character/selection/HeroSelectionState';

const { ccclass } = _decorator;

@ccclass('BattleTutorialController')
export class BattleTutorialController extends Component {
    private static readonly KEY =
        'TonightDefense.Tutorial.Battle.V1';

    private shown = false;

    update(): void {
        if (
            this.shown ||
            !HeroSelectionState.hasSelected ||
            sys.localStorage.getItem(
                BattleTutorialController.KEY,
            ) === 'done'
        ) {
            return;
        }

        this.shown = true;
        this.showGuide();
    }

    private showGuide(): void {
        const canvas = this.node.parent;

        if (!canvas) {
            return;
        }

        const root = new Node('BattleTutorial');
        root.layer = Layers.Enum.UI_2D;
        canvas.addChild(root);
        root.setPosition(0, -185, 0);
        root.addComponent(UITransform)
            .setContentSize(610, 126);

        const graphics = root.addComponent(Graphics);
        graphics.fillColor = new Color(24, 49, 84, 238);
        graphics.roundRect(-305, -63, 610, 126, 20);
        graphics.fill();
        graphics.strokeColor = new Color(232, 186, 75, 255);
        graphics.lineWidth = 4;
        graphics.roundRect(-302, -60, 604, 120, 18);
        graphics.stroke();

        const labelNode = new Node('GuideText');
        labelNode.layer = Layers.Enum.UI_2D;
        root.addChild(labelNode);
        labelNode.addComponent(UITransform)
            .setContentSize(560, 90);

        const label = labelNode.addComponent(Label);
        label.string =
            '左侧摇杆控制主角移动\n右侧四个技能负责输出、控制、生存与终极爆发\n点击任意位置开始守城';
        label.fontSize = 22;
        label.lineHeight = 29;
        label.color = new Color(255, 247, 222, 255);

        const finish = () => {
            sys.localStorage.setItem(
                BattleTutorialController.KEY,
                'done',
            );
            if (root.isValid) {
                root.destroy();
            }
        };

        root.on(Node.EventType.TOUCH_END, finish);
        this.scheduleOnce(finish, 6);
    }
}
