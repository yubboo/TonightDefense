import {
    _decorator,
    Component,
} from 'cc';

const { ccclass } = _decorator;

export interface BattleStatisticsSnapshot {
    damageDealt: number;
    enemiesDefeated: number;
    skillCasts: number;
    elapsedSeconds: number;
}

/** 战斗统计唯一累计入口；只读展示层不得自行累计。 */
@ccclass('BattleStatisticsService')
export class BattleStatisticsService extends Component {
    static instance:
        BattleStatisticsService | null = null;

    private damageDealt = 0;
    private enemiesDefeated = 0;
    private skillCasts = 0;
    private elapsedSeconds = 0;

    onLoad(): void {
        BattleStatisticsService.instance = this;
    }

    onDestroy(): void {
        if (BattleStatisticsService.instance === this) {
            BattleStatisticsService.instance = null;
        }
    }

    update(dt: number): void {
        this.elapsedSeconds += dt;
    }

    recordDamage(amount: number): void {
        this.damageDealt +=
            Math.max(0, amount);
    }

    recordEnemyDefeated(): void {
        this.enemiesDefeated += 1;
    }

    recordSkillCast(): void {
        this.skillCasts += 1;
    }

    get snapshot(): BattleStatisticsSnapshot {
        return {
            damageDealt: Math.round(this.damageDealt),
            enemiesDefeated: this.enemiesDefeated,
            skillCasts: this.skillCasts,
            elapsedSeconds: this.elapsedSeconds,
        };
    }
}
