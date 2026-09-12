/**
 * @architecture TonightDefense V1.0
 * @owner character
 * @module selection
 *
 * 开局主角随机三选一。
 *
 * 修复点：
 * - 不再只依赖一次 Math.random() 洗牌。
 * - 混入时间、运行批次和随机值。
 * - 同一次运行周期内避免连续出现完全相同的三人组合。
 */
import {
    CharacterDefinition,
    getMainHeroCandidates,
} from '../data/CharacterCatalog';

import {
    HeroSelectionState,
} from './HeroSelectionState';

export class StarterHeroSelectionService {
    private static lastSignature =
        '';

    static rollThree():
        CharacterDefinition[] {
        const source =
            getMainHeroCandidates();

        if (
            source.length <= 3
        ) {
            return [...source];
        }

        let result:
            CharacterDefinition[] =
            [];

        for (
            let attempt = 0;
            attempt < 6;
            attempt += 1
        ) {
            const pool =
                [...source];

            const seed =
                this.makeSeed(
                    attempt,
                );

            this.shuffleWithSeed(
                pool,
                seed,
            );

            result =
                pool.slice(
                    0,
                    3,
                );

            const signature =
                result
                    .map(
                        (
                            item,
                        ) =>
                            item.id,
                    )
                    .join('|');

            if (
                signature !==
                this.lastSignature
            ) {
                this.lastSignature =
                    signature;

                console.log(
                    `[今晚守城] 主角候选随机结果：${result.map((item) => item.name).join(' / ')}`,
                );

                return result;
            }
        }

        /**
         * 极端情况下做一次位置轮转，
         * 保证玩家肉眼不会看到“连续完全一样”。
         */
        result.push(
            result.shift()!,
        );

        this.lastSignature =
            result
                .map(
                    (
                        item,
                    ) =>
                        item.id,
                )
                .join('|');

        return result;
    }

    private static makeSeed(
        attempt: number,
    ): number {
        const now =
            Date.now();

        const perf =
            typeof performance !==
                'undefined' &&
            typeof performance.now ===
                'function'
                ? Math.floor(
                    performance.now() *
                    1000,
                )
                : 0;

        const randomBits =
            Math.floor(
                Math.random() *
                0x7fffffff,
            );

        return (
            now ^
            perf ^
            randomBits ^
            (
                HeroSelectionState
                    .currentRunId *
                0x45d9f3b
            ) ^
            (
                attempt *
                0x27d4eb2d
            )
        ) >>> 0;
    }

    private static shuffleWithSeed<T>(
        input: T[],
        seed: number,
    ): void {
        let state =
            seed || 0x12345678;

        const nextRandom =
            (): number => {
                state ^=
                    state << 13;

                state ^=
                    state >>> 17;

                state ^=
                    state << 5;

                state >>>= 0;

                return (
                    state /
                    0xffffffff
                );
            };

        for (
            let i =
                input.length - 1;
            i > 0;
            i -= 1
        ) {
            const j =
                Math.floor(
                    nextRandom() *
                    (i + 1),
                );

            [
                input[i],
                input[j],
            ] = [
                input[j],
                input[i],
            ];
        }
    }
}
