import {
    Layers,
    Node,
    NodePool,
} from 'cc';

/** 短生命周期战斗特效节点池，避免微信端连续释放技能造成 GC 峰值。 */
export class BattleEffectPool {
    private static readonly pulsePool =
        new NodePool();

    static acquirePulse(): Node {
        const node =
            this.pulsePool.size() > 0
                ? this.pulsePool.get()!
                : new Node('ActiveSkillPulse');

        node.layer = Layers.Enum.UI_2D;
        node.active = true;
        return node;
    }

    static releasePulse(node: Node): void {
        if (!node.isValid) {
            return;
        }

        node.removeFromParent();
        this.pulsePool.put(node);
    }

    static clear(): void {
        this.pulsePool.clear();
    }
}
