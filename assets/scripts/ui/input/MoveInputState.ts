/**
 * @architecture TonightDefense V1.0
 * @owner ui
 * @module input
 * @migratedFrom input/MoveInputState.ts
 */
import { Vec2 } from 'cc';

export class MoveInputState {
    static readonly direction = new Vec2(0, 0);

    static set(x: number, y: number): void {
        this.direction.set(x, y);
    }

    static clear(): void {
        this.direction.set(0, 0);
    }
}
