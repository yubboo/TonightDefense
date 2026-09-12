import {
    Vec2,
    Vec3,
} from 'cc';

import {
    EnemyController,
    EnemyTarget,
} from '../../../battle/enemy/EnemyController';

import {
    HeroSkillActor,
} from '../runtime/HeroSkillActor';

export class SkillTargeting {
    static nearestEnemy(
        position: Vec2 | Vec3,
        range: number,
    ): EnemyTarget | null {
        return EnemyController.instance
            ?.findNearestEnemy(
                position,
                range,
            ) ?? null;
    }

    static highestHpEnemy(
        position: Vec2 | Vec3,
        range: number,
    ): EnemyTarget | null {
        return EnemyController.instance
            ?.findHighestHpEnemy(
                position,
                range,
            ) ?? null;
    }

    static enemiesInRadius(
        position: Vec2 | Vec3,
        radius: number,
    ): EnemyTarget[] {
        return EnemyController.instance
            ?.findEnemiesInRadius(
                position,
                radius,
            ) ?? [];
    }

    static densestEnemyCluster(
        position: Vec2 | Vec3,
        range: number,
        radius: number,
    ): EnemyTarget[] {
        const controller =
            EnemyController.instance;

        if (!controller) {
            return [];
        }

        const enemies =
            controller.getAliveEnemies();

        if (enemies.length <= 0) {
            return [];
        }

        const rangeSq =
            Math.max(0, range) *
            Math.max(0, range);

        let best:
            EnemyTarget | null = null;
        let bestCount = 0;

        for (const candidate of enemies) {
            const dx =
                candidate.node.position.x -
                position.x;
            const dy =
                candidate.node.position.y -
                position.y;

            if (
                dx * dx + dy * dy >
                rangeSq
            ) {
                continue;
            }

            const nearby =
                controller.findEnemiesInRadius(
                    candidate.node.position,
                    radius,
                );

            if (
                nearby.length >
                bestCount
            ) {
                best = candidate;
                bestCount = nearby.length;
            }
        }

        if (!best) {
            return [];
        }

        return controller.findEnemiesInRadius(
            best.node.position,
            radius,
        );
    }

    static frontLine(
        source: Vec2 | Vec3,
        range: number,
        halfWidth: number,
    ): EnemyTarget[] {
        const controller =
            EnemyController.instance;

        const anchor =
            controller
                ?.findNearestEnemy(
                    source,
                    range,
                );

        if (!controller || !anchor) {
            return [];
        }

        const direction =
            this.normalizedDirection(
                source,
                anchor.node.position,
            );

        const result:
            EnemyTarget[] = [];

        for (
            const enemy
            of controller.getAliveEnemies()
        ) {
            const dx =
                enemy.node.position.x -
                source.x;
            const dy =
                enemy.node.position.y -
                source.y;

            const forward =
                dx * direction.x +
                dy * direction.y;

            if (
                forward < 0 ||
                forward > range
            ) {
                continue;
            }

            const side =
                Math.abs(
                    dx * -direction.y +
                    dy * direction.x,
                );

            if (side <= halfWidth) {
                result.push(enemy);
            }
        }

        return result;
    }

    static frontCone(
        source: Vec2 | Vec3,
        range: number,
        halfAngleDegrees = 42,
    ): EnemyTarget[] {
        const controller =
            EnemyController.instance;

        const anchor =
            controller
                ?.findNearestEnemy(
                    source,
                    range,
                );

        if (!controller || !anchor) {
            return [];
        }

        const direction =
            this.normalizedDirection(
                source,
                anchor.node.position,
            );

        const minDot =
            Math.cos(
                halfAngleDegrees *
                Math.PI /
                180,
            );

        const result:
            EnemyTarget[] = [];

        for (
            const enemy
            of controller.getAliveEnemies()
        ) {
            const dx =
                enemy.node.position.x -
                source.x;
            const dy =
                enemy.node.position.y -
                source.y;
            const distance =
                Math.sqrt(
                    dx * dx + dy * dy,
                );

            if (
                distance <= 0.001 ||
                distance > range
            ) {
                continue;
            }

            const dot =
                (
                    dx * direction.x +
                    dy * direction.y
                ) /
                distance;

            if (dot >= minDot) {
                result.push(enemy);
            }
        }

        return result;
    }

    static lowestHpAlly(
        allies: readonly HeroSkillActor[],
    ): HeroSkillActor | null {
        let best:
            HeroSkillActor | null = null;
        let bestRatio =
            Number.POSITIVE_INFINITY;

        for (const ally of allies) {
            if (
                !ally.combatant.isAlive ||
                !ally.node.isValid
            ) {
                continue;
            }

            const ratio =
                ally.combatant.currentHp /
                Math.max(
                    1,
                    ally.combatant.maxHp,
                );

            if (ratio < bestRatio) {
                bestRatio = ratio;
                best = ally;
            }
        }

        return best;
    }

    static teamCenter(
        allies: readonly HeroSkillActor[],
    ): Vec3 | null {
        let x = 0;
        let y = 0;
        let count = 0;

        for (const ally of allies) {
            if (
                !ally.combatant.isAlive ||
                !ally.node.isValid
            ) {
                continue;
            }

            x += ally.node.position.x;
            y += ally.node.position.y;
            count += 1;
        }

        return count > 0
            ? new Vec3(
                x / count,
                y / count,
                0,
            )
            : null;
    }

    private static normalizedDirection(
        from: Vec2 | Vec3,
        to: Vec2 | Vec3,
    ): { x: number; y: number } {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length =
            Math.max(
                0.001,
                Math.sqrt(
                    dx * dx + dy * dy,
                ),
            );

        return {
            x: dx / length,
            y: dy / length,
        };
    }
}
