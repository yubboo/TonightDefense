import {
    ItemCatalog,
} from '../../item/definition/ItemCatalog';

import {
    ItemId,
} from '../../item/definition/ItemTypes';

import {
    WarehouseRepository,
} from '../../warehouse/repository/WarehouseRepository';

import {
    InventoryChangeEvent,
    InventoryChangeListener,
    InventoryStack,
} from '../data/InventoryTypes';

/**
 * InventorySystem / 背包系统
 *
 * 拥有“玩家当前持有多少道具”的运行时状态。
 * 长期保存交给 WarehouseSystem。
 */
export class InventoryService {
    private static loaded = false;

    private static readonly counts =
        new Map<ItemId, number>();

    private static readonly listeners =
        new Set<InventoryChangeListener>();

    static getCount(
        itemId:
            ItemId,
    ): number {
        this.ensureLoaded();

        return (
            this.counts.get(
                itemId,
            ) ??
            0
        );
    }

    static getAll():
        InventoryStack[] {
        this.ensureLoaded();

        const result:
            InventoryStack[] = [];

        for (
            const definition
            of ItemCatalog.getAll()
        ) {
            const count =
                this.getCount(
                    definition.id,
                );

            if (
                count <=
                0
            ) {
                continue;
            }

            result.push({
                itemId:
                    definition.id,
                count,
            });
        }

        return result;
    }

    static add(
        itemId:
            ItemId,
        amount:
            number,
    ): number {
        this.ensureLoaded();

        const definition =
            ItemCatalog.get(
                itemId,
            );

        const safe =
            Math.max(
                0,
                Math.floor(
                    amount,
                ),
            );

        if (
            safe <=
            0
        ) {
            return this.getCount(
                itemId,
            );
        }

        const previous =
            this.getCount(
                itemId,
            );

        const next =
            Math.min(
                definition
                    .stackLimit,
                previous +
                    safe,
            );

        this.counts.set(
            itemId,
            next,
        );

        this.persist();

        this.emit({
            itemId,
            delta:
                next -
                previous,
            count:
                next,
        });

        return next;
    }

    static canRemove(
        itemId:
            ItemId,
        amount:
            number,
    ): boolean {
        return (
            this.getCount(
                itemId,
            ) >=
            Math.max(
                0,
                Math.floor(
                    amount,
                ),
            )
        );
    }

    static tryRemove(
        itemId:
            ItemId,
        amount:
            number,
    ): boolean {
        this.ensureLoaded();

        const safe =
            Math.max(
                0,
                Math.floor(
                    amount,
                ),
            );

        if (
            safe <=
            0
        ) {
            return true;
        }

        const previous =
            this.getCount(
                itemId,
            );

        if (
            previous <
            safe
        ) {
            return false;
        }

        const next =
            previous -
            safe;

        if (
            next <=
            0
        ) {
            this.counts.delete(
                itemId,
            );
        } else {
            this.counts.set(
                itemId,
                next,
            );
        }

        this.persist();

        this.emit({
            itemId,
            delta:
                -safe,
            count:
                next,
        });

        return true;
    }

    static subscribe(
        listener:
            InventoryChangeListener,
    ): () => void {
        this.listeners.add(
            listener,
        );

        return () => {
            this.listeners.delete(
                listener,
            );
        };
    }

    private static ensureLoaded():
        void {
        if (
            this.loaded
        ) {
            return;
        }

        this.loaded =
            true;

        const raw =
            WarehouseRepository
                .loadItems();

        for (
            const key
            in raw
        ) {
            if (
                !ItemCatalog
                    .isItemId(
                        key,
                    )
            ) {
                continue;
            }

            const safe =
                Math.max(
                    0,
                    Math.floor(
                        Number(
                            raw[key],
                        ),
                    ),
                );

            if (
                safe >
                0
            ) {
                this.counts.set(
                    key,
                    safe,
                );
            }
        }
    }

    private static persist():
        void {
        const data:
            Record<
                string,
                number
            > = {};

        for (
            const [
                itemId,
                count,
            ]
            of this.counts
        ) {
            data[itemId] =
                count;
        }

        WarehouseRepository
            .saveItems(
                data,
            );
    }

    private static emit(
        event:
            InventoryChangeEvent,
    ): void {
        for (
            const listener
            of this.listeners
        ) {
            listener(
                event,
            );
        }
    }
}
