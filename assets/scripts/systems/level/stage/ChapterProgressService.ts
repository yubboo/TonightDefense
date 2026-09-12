import {
    sys,
} from 'cc';

export interface ChapterProgressState {
    chapterNumber: number;
    completedWaves: number;
    totalWaves: number;
}

interface ChapterProgressSaveData {
    version: 1;

    chapters:
        Record<
            string,
            number
        >;
}

/**
 * LevelSystem / 大关小关进度。
 *
 * 职责：
 * - 保存“某大关已经通过到第几小关”。
 * - 大厅关卡卡显示真实进度。
 *
 * 不负责：
 * - 波次刷怪。
 * - 星级评价。
 * - 阶段宝箱奖励。
 *
 * 当前记录的是历史最高通过小关，
 * 因为现阶段重新进入战斗仍从第1小关开始，
 * 所以大厅 UI 使用“最高进度”这个准确表述。
 */
export class ChapterProgressService {
    private static readonly STORAGE_KEY =
        'TonightDefense.ChapterProgress.V1';

    static readonly DEFAULT_TOTAL_WAVES =
        40;

    static getState(
        chapterNumber:
            number,
        totalWaves =
            this.DEFAULT_TOTAL_WAVES,
    ): ChapterProgressState {
        const chapter =
            this.normalizeChapter(
                chapterNumber,
            );

        const total =
            this.normalizeTotal(
                totalWaves,
            );

        const data =
            this.read();

        const completed =
            Math.max(
                0,
                Math.min(
                    total,
                    Math.floor(
                        data
                            .chapters[
                            `${chapter}`
                        ] ??
                        0,
                    ),
                ),
            );

        return {
            chapterNumber:
                chapter,

            completedWaves:
                completed,

            totalWaves:
                total,
        };
    }

    static recordCompletedWave(
        chapterNumber:
            number,
        completedWave:
            number,
        totalWaves =
            this.DEFAULT_TOTAL_WAVES,
    ): ChapterProgressState {
        const current =
            this.getState(
                chapterNumber,
                totalWaves,
            );

        const nextCompleted =
            Math.max(
                current
                    .completedWaves,
                Math.min(
                    current
                        .totalWaves,
                    Math.max(
                        0,
                        Math.floor(
                            completedWave,
                        ),
                    ),
                ),
            );

        if (
            nextCompleted ===
            current.completedWaves
        ) {
            return current;
        }

        const data =
            this.read();

        data.chapters[
            `${current.chapterNumber}`
        ] =
            nextCompleted;

        this.write(
            data,
        );

        return {
            ...current,
            completedWaves:
                nextCompleted,
        };
    }

    private static normalizeChapter(
        chapterNumber:
            number,
    ): number {
        return Math.max(
            1,
            Math.floor(
                chapterNumber,
            ),
        );
    }

    private static normalizeTotal(
        totalWaves:
            number,
    ): number {
        return Math.max(
            1,
            Math.floor(
                totalWaves,
            ),
        );
    }

    private static read():
        ChapterProgressSaveData {
        const raw =
            sys.localStorage
                .getItem(
                    this.STORAGE_KEY,
                );

        if (!raw) {
            return this.createEmpty();
        }

        try {
            const parsed =
                JSON.parse(
                    raw,
                ) as
                    Partial<
                        ChapterProgressSaveData
                    >;

            return {
                version: 1,

                chapters:
                    parsed.chapters &&
                    typeof parsed.chapters ===
                        'object'
                        ? {
                            ...parsed
                                .chapters,
                        }
                        : {},
            };
        } catch (
            error
        ) {
            console.warn(
                '[关卡系统] 章节进度读取失败，使用空进度',
                error,
            );

            return this.createEmpty();
        }
    }

    private static write(
        data:
            ChapterProgressSaveData,
    ): void {
        sys.localStorage
            .setItem(
                this.STORAGE_KEY,
                JSON.stringify(
                    data,
                ),
            );
    }

    private static createEmpty():
        ChapterProgressSaveData {
        return {
            version: 1,
            chapters: {},
        };
    }
}
