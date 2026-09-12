import {
    _decorator,
    Component,
    Node,
} from 'cc';

import {
    EnemyController,
} from '../../battle/enemy/EnemyController';

const { ccclass } = _decorator;

interface BurningRuntime {
    node: Node;
    remaining: number;
    tick: number;
    dps: number;
}

/** 燃烧等持续状态的唯一计时与伤害入口。 */
@ccclass('StatusEffectSystem')
export class StatusEffectSystem extends Component {
    static instance:
        StatusEffectSystem | null = null;

    private readonly burning:
        BurningRuntime[] = [];

    onLoad(): void {
        StatusEffectSystem.instance = this;
    }

    onDestroy(): void {
        this.burning.length = 0;

        if (StatusEffectSystem.instance === this) {
            StatusEffectSystem.instance = null;
        }
    }

    update(dt: number): void {
        for (let i = this.burning.length - 1; i >= 0; i -= 1) {
            const effect = this.burning[i];

            if (!effect.node.isValid) {
                this.burning.splice(i, 1);
                continue;
            }

            effect.remaining -= dt;
            effect.tick -= dt;

            if (effect.tick <= 0) {
                effect.tick += 0.5;
                EnemyController.instance
                    ?.takeDamageToEnemy(
                        effect.node,
                        effect.dps * 0.5,
                    );
            }

            if (effect.remaining <= 0) {
                this.burning.splice(i, 1);
            }
        }
    }

    applyBurn(
        targets: readonly Node[],
        duration: number,
        dps: number,
    ): void {
        for (const node of targets) {
            const existing =
                this.burning.find(
                    (item) => item.node === node,
                );

            if (existing) {
                existing.remaining =
                    Math.max(existing.remaining, duration);
                existing.dps =
                    Math.max(existing.dps, dps);
                continue;
            }

            this.burning.push({
                node,
                remaining: duration,
                tick: 0.5,
                dps,
            });
        }
    }
}
