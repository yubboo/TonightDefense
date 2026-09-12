import {
    _decorator,
    Color,
    Component,
    Label,
    Layers,
    Node,
    UITransform,
} from 'cc';

import {
    BattleStatisticsService,
} from '../../systems/battle/statistics/BattleStatisticsService';

const { ccclass } = _decorator;

@ccclass('BattleDebugPanel')
export class BattleDebugPanel extends Component {
    private label: Label | null = null;
    private timer = 0;

    start(): void {
        const flags =
            globalThis as unknown as
                Record<string, unknown>;

        if (flags.TONIGHT_DEFENSE_DEBUG !== true) {
            return;
        }

        const canvas = this.node.parent;

        if (!canvas) {
            return;
        }

        const root = new Node('BattleDebugPanel');
        root.layer = Layers.Enum.UI_2D;
        canvas.addChild(root);
        root.setPosition(-225, 445, 0);
        root.addComponent(UITransform)
            .setContentSize(250, 110);

        const label = root.addComponent(Label);
        label.fontSize = 16;
        label.lineHeight = 21;
        label.color = new Color(255, 242, 184, 255);
        this.label = label;
    }

    update(dt: number): void {
        if (!this.label) {
            return;
        }

        this.timer -= dt;

        if (this.timer > 0) {
            return;
        }

        this.timer = 0.35;
        const stats =
            BattleStatisticsService.instance
                ?.snapshot;

        if (!stats) {
            return;
        }

        this.label.string =
            `DEBUG\n伤害 ${stats.damageDealt}\n击杀 ${stats.enemiesDefeated}  技能 ${stats.skillCasts}\n时间 ${stats.elapsedSeconds.toFixed(1)}s`;
    }
}
