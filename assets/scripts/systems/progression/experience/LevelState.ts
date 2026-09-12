/**
 * @architecture TonightDefense V1.0
 * @owner progression
 * @module experience
 * @migratedFrom progression/LevelState.ts
 */
import { GAME_CONSTANTS } from '../../../shared/GameConstants';

export class LevelState {
    level = GAME_CONSTANTS.START_LEVEL;
    exp = 0;

    get expToNextLevel(): number {
        return GAME_CONSTANTS.BASE_EXP_TO_LEVEL + (this.level - 1) * 5;
    }

    addExp(amount: number): number {
        this.exp += Math.max(0, amount);
        let levelUps = 0;

        while (this.exp >= this.expToNextLevel) {
            this.exp -= this.expToNextLevel;
            this.level += 1;
            levelUps += 1;
        }

        return levelUps;
    }
}
