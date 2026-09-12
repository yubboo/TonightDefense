import {
    ItemId,
} from '../../item/definition/ItemTypes';

export interface InventoryStack {
    itemId: ItemId;
    count: number;
}

export interface InventoryChangeEvent {
    itemId: ItemId;
    delta: number;
    count: number;
}

export type InventoryChangeListener =
    (event: InventoryChangeEvent) => void;
