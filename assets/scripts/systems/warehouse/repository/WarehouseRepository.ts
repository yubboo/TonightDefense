import { sys } from 'cc';

export interface StageChestPersistState {
    unlockedStars: number;
    claimedStars: number[];
}

interface WarehouseSaveData {
    version: 1;

    items:
        Record<string, number>;

    stageChests:
        Record<string, StageChestPersistState>;
}

/**
 * WarehouseSystem / 仓库系统
 *
 * 只负责“长期数据怎么存”。
 * 不决定道具是什么，也不决定奖励怎么发。
 */
export class WarehouseRepository {
    private static readonly STORAGE_KEY =
        'TonightDefense.Warehouse.V1';

    static loadItems():
        Record<string, number> {
        const data = this.read();

        return {
            ...data.items,
        };
    }

    static saveItems(
        items:
            Record<string, number>,
    ): void {
        const data = this.read();

        data.items = {
            ...items,
        };

        this.write(data);
    }

    static loadStageChest(
        chapterNumber:
            number,
    ): StageChestPersistState {
        const data = this.read();

        const key =
            `${Math.max(
                1,
                Math.floor(
                    chapterNumber,
                ),
            )}`;

        const state =
            data.stageChests[
                key
            ];

        if (!state) {
            return {
                unlockedStars: 0,
                claimedStars: [],
            };
        }

        return {
            unlockedStars:
                Math.max(
                    0,
                    Math.min(
                        3,
                        Math.floor(
                            state
                                .unlockedStars ??
                            0,
                        ),
                    ),
                ),

            claimedStars:
                Array.isArray(
                    state
                        .claimedStars,
                )
                    ? state
                        .claimedStars
                        .filter(
                            (
                                value,
                            ) =>
                                value === 1 ||
                                value === 2 ||
                                value === 3,
                        )
                    : [],
        };
    }

    static saveStageChest(
        chapterNumber:
            number,
        state:
            StageChestPersistState,
    ): void {
        const data = this.read();

        const key =
            `${Math.max(
                1,
                Math.floor(
                    chapterNumber,
                ),
            )}`;

        data.stageChests[
            key
        ] = {
            unlockedStars:
                Math.max(
                    0,
                    Math.min(
                        3,
                        Math.floor(
                            state
                                .unlockedStars,
                        ),
                    ),
                ),

            claimedStars:
                [...new Set(
                    state
                        .claimedStars
                        .filter(
                            (
                                value,
                            ) =>
                                value === 1 ||
                                value === 2 ||
                                value === 3,
                        ),
                )],
        };

        this.write(data);
    }

    private static read():
        WarehouseSaveData {
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
                        WarehouseSaveData
                    >;

            return {
                version: 1,

                items:
                    parsed.items &&
                    typeof parsed.items ===
                        'object'
                        ? {
                            ...parsed.items,
                        }
                        : {},

                stageChests:
                    parsed.stageChests &&
                    typeof parsed.stageChests ===
                        'object'
                        ? {
                            ...parsed.stageChests,
                        }
                        : {},
            };
        } catch (
            error
        ) {
            console.warn(
                '[仓库系统] 存档读取失败，使用空仓库',
                error,
            );

            return this.createEmpty();
        }
    }

    private static write(
        data:
            WarehouseSaveData,
    ): void {
        sys.localStorage.setItem(
            this.STORAGE_KEY,
            JSON.stringify(
                data,
            ),
        );
    }

    private static createEmpty():
        WarehouseSaveData {
        return {
            version: 1,
            items: {},
            stageChests: {},
        };
    }
}
