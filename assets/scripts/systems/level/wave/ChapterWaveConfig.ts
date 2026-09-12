/**
 * @architecture TonightDefense V1.0
 * @owner level
 * @module wave
 *
 * 一个大关固定 40 个小关。
 *
 * 1~10：
 *   主要增加怪物数量。
 *
 * 11~20：
 *   数量继续小幅增加，重点增强攻击。
 *
 * 21~30：
 *   攻击 + 防御增强，开始稳定出现精英怪。
 *
 * 31~39：
 *   大多数为精英怪。
 *
 * 40：
 *   普通怪 -> 全精英 -> BOSS 来袭通告 -> Boss。
 */
export const CHAPTER_WAVE_COUNT = 40;

export interface StandardWaveDefinition {
    waveNumber: number;

    /**
     * 显示用怪物等级。
     */
    enemyLevel: number;

    totalEnemies: number;

    eliteRatio: number;
    rangedRatio: number;

    spawnInterval: number;

    hpMultiplier: number;
    attackMultiplier: number;
    defenseBonus: number;
    speedMultiplier: number;
}

export interface FinalWaveDefinition {
    waveNumber: 40;

    enemyLevel: number;

    normalCount: number;
    eliteCount: number;

    spawnInterval: number;

    hpMultiplier: number;
    attackMultiplier: number;
    defenseBonus: number;
    speedMultiplier: number;

    bossWarningDuration: number;
    bossSpawnDelay: number;
}

function chapterDifficulty(
    chapterNumber: number,
): number {
    return (
        1 +
        Math.max(
            0,
            chapterNumber - 1,
        ) *
            0.32
    );
}

export function getStandardWaveDefinition(
    chapterNumber: number,
    waveNumber: number,
): StandardWaveDefinition {
    const wave =
        Math.max(
            1,
            Math.min(
                39,
                Math.floor(
                    waveNumber,
                ),
            ),
        );

    const chapterScale =
        chapterDifficulty(
            chapterNumber,
        );

    let totalEnemies = 0;
    let eliteRatio = 0;
    let attackMultiplier = 1;
    let defenseBonus = 0;

    if (wave <= 10) {
        /**
         * 5 -> 14 只。
         * 第一大关前 10 小关以数量成长为主。
         */
        totalEnemies =
            4 + wave;

        eliteRatio = 0;

        attackMultiplier =
            0.82 +
            wave *
                0.018;
    } else if (
        wave <= 20
    ) {
        /**
         * 15 -> 19 只。
         * 攻击力明显开始成长。
         */
        totalEnemies =
            14 +
            Math.ceil(
                (
                    wave -
                    10
                ) /
                2,
            );

        /**
         * 11~20 不引入精英怪，
         * 这一段只让玩家明显感受到“攻击力上升”。
         */
        eliteRatio = 0;

        attackMultiplier =
            1.02 +
            (
                wave -
                10
            ) *
                0.075;
    } else if (
        wave <= 30
    ) {
        /**
         * 攻防一起增加，精英比例 20% -> 50%。
         */
        totalEnemies =
            19 +
            Math.ceil(
                (
                    wave -
                    20
                ) /
                2,
            );

        eliteRatio =
            0.15 +
            (
                wave -
                21
            ) *
                0.034;

        attackMultiplier =
            1.78 +
            (
                wave -
                20
            ) *
                0.07;

        defenseBonus =
            1 +
            Math.floor(
                (
                    wave -
                    20
                ) /
                2,
            );
    } else {
        /**
         * 31~39：精英怪成为主体。
         */
        totalEnemies =
            24 +
            (
                wave -
                31
            );

        eliteRatio =
            Math.min(
                0.90,
                0.62 +
                (
                    wave -
                    31
                ) *
                    0.035,
            );

        attackMultiplier =
            2.48 +
            (
                wave -
                30
            ) *
                0.085;

        defenseBonus =
            5 +
            Math.floor(
                (
                    wave -
                    31
                ) /
                2,
            );
    }

    /**
     * 远程怪前期少，后期稳定存在。
     */
    const rangedRatio =
        Math.min(
            0.38,
            0.10 +
            wave *
                0.0065,
        );

    /**
     * 怪物移动不随波次疯狂加速。
     * 难度主要来自数量、攻击、防御和精英比例。
     */
    const speedMultiplier =
        0.72 +
        Math.min(
            0.10,
            wave *
                0.0025,
        );

    return {
        waveNumber: wave,

        enemyLevel:
            (
                chapterNumber -
                1
            ) *
                40 +
            wave,

        totalEnemies,

        eliteRatio,

        rangedRatio,

        /**
         * 前期给玩家足够反应时间。
         */
        spawnInterval:
            Math.max(
                0.62,
                1.15 -
                wave *
                    0.012,
            ),

        hpMultiplier:
            chapterScale *
            (
                0.86 +
                wave *
                    0.035
            ),

        attackMultiplier:
            chapterScale *
            attackMultiplier,

        defenseBonus:
            defenseBonus +
            Math.floor(
                (
                    chapterNumber -
                    1
                ) *
                    2,
            ),

        speedMultiplier,
    };
}

export function getFinalWaveDefinition(
    chapterNumber: number,
): FinalWaveDefinition {
    const chapterScale =
        chapterDifficulty(
            chapterNumber,
        );

    return {
        waveNumber: 40,

        enemyLevel:
            chapterNumber *
            40,

        /**
         * 最终小关：
         * 先一小批普通怪热身。
         */
        normalCount: 7,

        /**
         * 普通怪清完后进入全精英阶段。
         */
        eliteCount: 12,

        spawnInterval: 0.72,

        hpMultiplier:
            chapterScale *
            2.35,

        attackMultiplier:
            chapterScale *
            2.85,

        defenseBonus:
            8 +
            (
                chapterNumber -
                1
            ) *
                2,

        speedMultiplier: 0.80,

        bossWarningDuration: 1.6,
        bossSpawnDelay: 1.15,
    };
}
