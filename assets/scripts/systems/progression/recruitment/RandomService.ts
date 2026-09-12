/**
 * @architecture TonightDefense V1.0
 * @owner progression
 * @module recruitment
 * @migratedFrom progression/RandomService.ts
 */
export class RandomService {
    static pickUnique<T>(source: readonly T[], count: number): T[] {
        const pool = [...source];
        const result: T[] = [];
        const wanted = Math.max(0, Math.min(count, pool.length));

        for (let i = 0; i < wanted; i += 1) {
            const index = Math.floor(Math.random() * pool.length);
            result.push(pool[index]);
            pool.splice(index, 1);
        }

        return result;
    }
}
