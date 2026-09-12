/**
 * @architecture TonightDefense V1.0
 * @owner progression
 * @module levelup
 *
 * 每个小关结束后的三选一类型。
 *
 * 第 1 / 2 / 6 / 8 波负责把 4 个伙伴位置补齐。
 * 第 9 波开始不再出现招募，全部进入技能强化。
 */
export type WaveRewardKind =
    | 'recruit'
    | 'skill';

const RECRUIT_WAVES =
    new Set<number>([
        1,
        2,
        6,
        8,
    ]);

export function getWaveRewardKind(
    waveNumber: number,
): WaveRewardKind {
    if (
        RECRUIT_WAVES.has(
            waveNumber,
        )
    ) {
        return 'recruit';
    }

    return 'skill';
}
