import {
    Vec2,
    Vec3,
} from 'cc';

import {
    EnemyController,
    EnemyTarget,
} from '../../battle/enemy/EnemyController';

export class SkillTargeting {
    static nearest(
        position: Vec2 | Vec3,
        range: number,
    ): EnemyTarget | null {
        return EnemyController.instance
            ?.findNearestEnemy(
                position,
                range,
            ) ?? null;
    }

    static circle(
        position: Vec2 | Vec3,
        radius: number,
    ): EnemyTarget[] {
        return EnemyController.instance
            ?.findEnemiesInRadius(
                position,
                radius,
            ) ?? [];
    }
}
