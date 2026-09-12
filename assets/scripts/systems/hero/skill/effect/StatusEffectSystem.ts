import {
    _decorator,
    Component,
    Node,
} from 'cc';

import {
    EnemyController,
} from '../../../battle/enemy/EnemyController';

import {
    CharacterCombatant,
    CharacterCombatModifier,
} from '../../character/stats/CharacterCombatant';

const { ccclass } = _decorator;

interface BurningRuntime {
    node: Node;
    remaining: number;
    tick: number;
    dps: number;
}

interface HeroModifierRuntime {
    combatant: CharacterCombatant;
    modifierId: string;
    remaining: number;
}

/**
 * SkillSystem 的持续状态计时器。
 *
 * 当前正式负责：
 * - 敌人燃烧 DoT；
 * - 英雄临时攻击/攻速/移速/减伤/治疗增益。
 *
 * 冰冻、嘲讽、拉扯等更复杂敌人控制继续由 SkillEffectResolver
 * 以安全降级方式结算，后续再扩 EnemyController 的状态接口。
 */
@ccclass('StatusEffectSystem')
export class StatusEffectSystem extends Component {
    static instance:
        StatusEffectSystem | null = null;

    private readonly burning:
        BurningRuntime[] = [];

    private readonly heroModifiers:
        HeroModifierRuntime[] = [];

    onLoad(): void {
        StatusEffectSystem.instance = this;
    }

    onDestroy(): void {
        for (
            const runtime
            of this.heroModifiers
        ) {
            if (
                runtime
                    .combatant
                    .node
                    .isValid
            ) {
                runtime
                    .combatant
                    .removeModifier(
                        runtime.modifierId,
                    );
            }
        }

        this.burning.length = 0;
        this.heroModifiers.length = 0;

        if (
            StatusEffectSystem.instance ===
            this
        ) {
            StatusEffectSystem.instance = null;
        }
    }

    update(dt: number): void {
        this.updateBurning(dt);
        this.updateHeroModifiers(dt);
    }

    applyBurn(
        targets: readonly Node[],
        duration: number,
        dps: number,
    ): void {
        for (const node of targets) {
            const existing =
                this.burning.find(
                    (item) =>
                        item.node === node,
                );

            if (existing) {
                existing.remaining =
                    Math.max(
                        existing.remaining,
                        duration,
                    );
                existing.dps =
                    Math.max(
                        existing.dps,
                        dps,
                    );
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

    applyHeroModifier(
        combatant: CharacterCombatant,
        modifierId: string,
        modifier: CharacterCombatModifier,
        duration: number,
    ): void {
        combatant.setModifier(
            modifierId,
            modifier,
        );

        const existing =
            this.heroModifiers.find(
                (item) =>
                    item.combatant ===
                        combatant &&
                    item.modifierId ===
                        modifierId,
            );

        if (existing) {
            existing.remaining =
                Math.max(
                    existing.remaining,
                    duration,
                );
            return;
        }

        this.heroModifiers.push({
            combatant,
            modifierId,
            remaining:
                Math.max(
                    0.05,
                    duration,
                ),
        });
    }

    private updateBurning(
        dt: number,
    ): void {
        for (
            let i =
                this.burning.length - 1;
            i >= 0;
            i -= 1
        ) {
            const effect =
                this.burning[i];

            if (
                !effect.node.isValid
            ) {
                this.burning.splice(
                    i,
                    1,
                );
                continue;
            }

            effect.remaining -= dt;
            effect.tick -= dt;

            if (
                effect.tick <= 0
            ) {
                effect.tick += 0.5;
                EnemyController.instance
                    ?.takeDamageToEnemy(
                        effect.node,
                        effect.dps * 0.5,
                    );
            }

            if (
                effect.remaining <= 0
            ) {
                this.burning.splice(
                    i,
                    1,
                );
            }
        }
    }

    private updateHeroModifiers(
        dt: number,
    ): void {
        for (
            let i =
                this.heroModifiers.length - 1;
            i >= 0;
            i -= 1
        ) {
            const runtime =
                this.heroModifiers[i];

            runtime.remaining -= dt;

            if (
                runtime.remaining > 0 &&
                runtime
                    .combatant
                    .node
                    .isValid
            ) {
                continue;
            }

            if (
                runtime
                    .combatant
                    .node
                    .isValid
            ) {
                runtime
                    .combatant
                    .removeModifier(
                        runtime.modifierId,
                    );
            }

            this.heroModifiers.splice(
                i,
                1,
            );
        }
    }
}
