import {
    BossId,
} from '../../battle/enemy/boss/BossCatalog';

import {
    EnemyArchetype,
} from '../../battle/enemy/EnemyTypes';

import {
    FinalWaveDefinition,
    getFinalWaveDefinition,
    getStandardWaveDefinition,
    StandardWaveDefinition,
} from '../wave/ChapterWaveConfig';

export interface StageEnemyPoolEntry {
    archetype: Exclude<EnemyArchetype, 'boss'>;
    cost: number;
    unlockWave: number;
}

export interface StageWaveDefinition
extends StandardWaveDefinition {
    budget: number;
}

export interface StageDefinition {
    id: string;
    chapterNumber: number;
    name: string;
    mapId: string;
    enemyPool: readonly StageEnemyPoolEntry[];
    waves: readonly StageWaveDefinition[];
    eliteWaves: readonly number[];
    bossId: BossId;
    mapModifiers: readonly string[];
    rewards: readonly string[];
    unlockCondition: string;
}

const DEFAULT_POOL:
    readonly StageEnemyPoolEntry[] = [
        {
            archetype: 'melee',
            cost: 10,
            unlockWave: 1,
        },
        {
            archetype: 'ranged',
            cost: 14,
            unlockWave: 11,
        },
    ];

function buildWaves(
    chapterNumber: number,
): StageWaveDefinition[] {
    const waves:
        StageWaveDefinition[] = [];

    for (let wave = 1; wave < 40; wave += 1) {
        const base =
            getStandardWaveDefinition(
                chapterNumber,
                wave,
            );

        const archetypeCost =
            10 *
                (1 - base.rangedRatio) +
            14 * base.rangedRatio;
        const averageCost =
            archetypeCost *
                (1 - base.eliteRatio) +
            archetypeCost * 1.8 *
                base.eliteRatio;

        const budget =
            Math.max(
                50,
                Math.round(
                    base.totalEnemies *
                    Math.max(10, averageCost),
                ),
            );

        waves.push({
            ...base,
            budget,
            totalEnemies:
                Math.max(
                    1,
                    Math.round(
                        budget /
                        Math.max(10, averageCost),
                    ),
                ),
        });
    }

    return waves;
}

const STAGES =
    new Map<number, StageDefinition>();

export function getStageDefinition(
    chapterNumber: number,
): StageDefinition {
    const chapter =
        Math.max(1, Math.floor(chapterNumber));

    const cached = STAGES.get(chapter);

    if (cached) {
        return cached;
    }

    const stage:
        StageDefinition = {
            id: `chapter_${chapter}_royal_road`,
            chapterNumber: chapter,
            name:
                chapter === 1
                    ? '王城林道'
                    : `王城外环 ${chapter}`,
            mapId: 'royal_city_outskirts',
            enemyPool: DEFAULT_POOL,
            waves: buildWaves(chapter),
            eliteWaves: [10, 20, 30],
            bossId: 'flame_dragon',
            mapModifiers: [
                'bounded-battlefield',
                'three-lane-pressure',
            ],
            rewards: [
                'chapter-progress',
                'stage-chest-star',
                'battle-drops',
            ],
            unlockCondition:
                chapter === 1
                    ? 'default'
                    : `chapter_${chapter - 1}_cleared`,
        };

    STAGES.set(chapter, stage);
    return stage;
}

export function getStageWaveDefinition(
    chapterNumber: number,
    waveNumber: number,
): StageWaveDefinition {
    const stage =
        getStageDefinition(chapterNumber);
    const index =
        Math.max(
            0,
            Math.min(
                stage.waves.length - 1,
                Math.floor(waveNumber) - 1,
            ),
        );

    return stage.waves[index];
}

export function getStageFinalWaveDefinition(
    chapterNumber: number,
): FinalWaveDefinition {
    return getFinalWaveDefinition(chapterNumber);
}
