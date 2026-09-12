import { sys } from 'cc';

export interface StageChestPersistState {
    unlockedStars: number;
    claimedStars: number[];
}

interface WarehouseSaveData {
    version: 2;

    items:
        Record<string, number>;

    stageChests:
        Record<string, StageChestPersistState>;

    equipped:
        Record<string, string>;
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

    private static readonly BACKUP_KEY =
        'TonightDefense.Warehouse.Backup';

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

    static loadEquipped():
        Record<string, string> {
        return {
            ...this.read().equipped,
        };
    }

    static saveEquipped(
        equipped: Record<string, string>,
    ): void {
        const data = this.read();
        data.equipped = {
            ...equipped,
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

            const migrated:
                WarehouseSaveData = {
                version: 2,

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

                equipped:
                    parsed.equipped &&
                    typeof parsed.equipped ===
                        'object'
                        ? {
                            ...parsed.equipped,
                        }
                        : {},
            };

            return migrated;
        } catch (
            error
        ) {
            console.warn(
                '[仓库系统] 主存档读取失败，尝试恢复备份',
                error,
            );

            const backupRaw =
                sys.localStorage.getItem(
                    this.BACKUP_KEY,
                );

            if (backupRaw) {
                try {
                    const backup = JSON.parse(
                        backupRaw,
                    ) as Partial<WarehouseSaveData>;

                    return {
                        version: 2,
                        items:
                            backup.items &&
                            typeof backup.items === 'object'
                                ? { ...backup.items }
                                : {},
                        stageChests:
                            backup.stageChests &&
                            typeof backup.stageChests === 'object'
                                ? { ...backup.stageChests }
                                : {},
                        equipped:
                            backup.equipped &&
                            typeof backup.equipped === 'object'
                                ? { ...backup.equipped }
                                : {},
                    };
                } catch (backupError) {
                    console.warn(
                        '[仓库系统] 备份存档也不可用',
                        backupError,
                    );
                }
            }

            return this.createEmpty();
        }
    }

    private static write(
        data:
            WarehouseSaveData,
    ): void {
        sys.localStorage.setItem(
            this.BACKUP_KEY,
            sys.localStorage.getItem(
                this.STORAGE_KEY,
            ) ?? '',
        );

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
            version: 2,
            items: {},
            stageChests: {},
            equipped: {},
        };
    }
}
