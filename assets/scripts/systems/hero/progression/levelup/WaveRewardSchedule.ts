/**
 * @architecture TonightDefense V1.0
 * @owner progression
 * @module levelup
 *
 * 每个小关结束后的三选一类型。
 *
 * 招募与成长只在关键波次出现，避免每波打断战斗。
 */
export type WaveRewardKind =
    | 'recruit'
    | 'skill';

const RECRUIT_WAVES =
    new Set<number>([
        1,
        6,
        15,
        25,
    ]);

const SKILL_WAVES =
    new Set<number>([
        3,
        10,
        20,
        30,
        35,
    ]);

export function getWaveRewardKind(
    waveNumber: number,
): WaveRewardKind | null {
    if (
        RECRUIT_WAVES.has(
            waveNumber,
        )
    ) {
        return 'recruit';
    }

    if (
        SKILL_WAVES.has(
            waveNumber,
        )
    ) {
        return 'skill';
    }

    return null;
}
