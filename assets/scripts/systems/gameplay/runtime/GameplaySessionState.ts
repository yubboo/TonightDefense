import {
    GameplayModeId,
} from '../mode/GameplayModeTypes';

/**
 * 只记录“一局准备/运行中的玩法上下文”。
 * 不负责关卡波次，不负责奖励，不负责体力扣除。
 */
export interface GameplaySessionSnapshot {
    modeId: GameplayModeId;
    chapterNumber: number;
    stageVariant: string;
}

export class GameplaySessionState {
    private static snapshot:
        GameplaySessionSnapshot = {
            modeId: 'campaign',
            chapterNumber: 1,
            stageVariant: 'normal',
        };

    static get(): GameplaySessionSnapshot {
        return {
            ...this.snapshot,
        };
    }

    static prepare(
        next: GameplaySessionSnapshot,
    ): void {
        this.snapshot = {
            ...next,
            chapterNumber: Math.max(
                1,
                Math.floor(next.chapterNumber),
            ),
        };
    }
}
