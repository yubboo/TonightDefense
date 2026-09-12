import {
    Color,
    Graphics,
    Layers,
    Node,
    tween,
    UITransform,
    Vec3,
} from 'cc';

import {
    MainHeroController,
} from '../../character/player/MainHeroController';

import {
    EnemyController,
} from '../../battle/enemy/EnemyController';

import {
    ActiveSkillDefinition,
} from './ActiveSkillCatalog';

import {
    SkillTargeting,
} from './SkillTargeting';

import {
    StatusEffectSystem,
} from './StatusEffectSystem';

import {
    BattleEffectPool,
} from '../../battle/runtime/BattleEffectPool';

export class SkillEffectResolver {
    static cast(
        hero: MainHeroController,
        skill: ActiveSkillDefinition,
    ): boolean {
        const source = hero.targetNode;
        const combatant = hero.combatant;

        if (!source || !combatant?.isAlive) {
            return false;
        }

        const attack = combatant.attackPower;

        if (skill.effectKind === 'self_shield') {
            combatant.addShield(
                attack * skill.powerRatio,
            );
            combatant.heal(
                attack * 0.8,
            );
            this.showPulse(source, 92, new Color(255, 105, 48, 180));
            return true;
        }

        if (skill.effectKind === 'self_heal') {
            combatant.heal(
                attack * skill.powerRatio,
            );
            this.showPulse(source, 86, new Color(102, 232, 135, 180));
            return true;
        }

        if (skill.effectKind === 'nearest_damage') {
            const target =
                SkillTargeting.nearest(
                    source.position,
                    skill.radius,
                );

            if (!target) {
                return false;
            }

            EnemyController.instance
                ?.takeDamageToEnemy(
                    target.node,
                    attack * skill.powerRatio,
                );

            this.applyBurn(
                [target.node],
                skill,
                attack,
            );

            this.showPulse(
                target.node,
                58,
                new Color(255, 88, 36, 205),
            );
            return true;
        }

        const targets =
            SkillTargeting.circle(
                source.position,
                skill.radius,
            );

        if (targets.length === 0) {
            return false;
        }

        EnemyController.instance
            ?.damageEnemiesInRadius(
                source.position,
                skill.radius,
                attack * skill.powerRatio,
                skill.knockback ?? 0,
            );

        this.applyBurn(
            targets.map((target) => target.node),
            skill,
            attack,
        );

        this.showPulse(
            source,
            Math.min(skill.radius, 260),
            new Color(255, 73, 28, 175),
        );
        return true;
    }

    private static applyBurn(
        nodes: readonly Node[],
        skill: ActiveSkillDefinition,
        attack: number,
    ): void {
        if (
            !skill.burnDuration ||
            !skill.burnDpsRatio
        ) {
            return;
        }

        StatusEffectSystem.instance
            ?.applyBurn(
                nodes,
                skill.burnDuration,
                attack * skill.burnDpsRatio,
            );
    }

    private static showPulse(
        target: Node,
        radius: number,
        color: Color,
    ): void {
        const parent = target.parent;

        if (!parent) {
            return;
        }

        const node = BattleEffectPool.acquirePulse();
        parent.addChild(node);
        node.setPosition(target.position);

        const transform =
            node.getComponent(UITransform) ??
            node.addComponent(UITransform);
        transform.setContentSize(radius * 2, radius * 2);

        const graphics =
            node.getComponent(Graphics) ??
            node.addComponent(Graphics);
        graphics.clear();
        graphics.strokeColor = color;
        graphics.lineWidth = 12;
        graphics.circle(0, 0, radius * 0.55);
        graphics.stroke();

        node.setScale(new Vec3(0.6, 0.6, 1));
        tween(node)
            .to(0.25, {
                scale: new Vec3(1.15, 1.15, 1),
            })
            .call(() => BattleEffectPool.releasePulse(node))
            .start();
    }
}
