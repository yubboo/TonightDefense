/**
 * @architecture TonightDefense V1.0
 * @owner character
 * @module selection
 *
 * 本局主角选择状态。
 */
import {
    CharacterDefinition,
} from '../data/CharacterCatalog';

export class HeroSelectionState {
    private static selected:
        CharacterDefinition | null =
        null;

    private static runId = 0;

    /**
     * 每次开始一局新战斗时调用。
     * 防止浏览器预览/场景重进后沿用上一局主角。
     */
    static beginNewRun(): number {
        this.runId += 1;
        this.selected = null;

        return this.runId;
    }

    static select(
        character:
            CharacterDefinition,
    ): void {
        this.selected =
            character;
    }

    static clear(): void {
        this.selected =
            null;
    }

    static get current():
        CharacterDefinition | null {
        return this.selected;
    }

    static get hasSelected(): boolean {
        return this.selected !== null;
    }

    static get currentRunId(): number {
        return this.runId;
    }

    static isSelected(
        characterId: string,
    ): boolean {
        return (
            this.selected?.id ===
            characterId
        );
    }
}
