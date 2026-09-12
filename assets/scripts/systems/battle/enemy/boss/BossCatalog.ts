/**
 * @architecture TonightDefense V1.0
 * @owner battle
 * @module enemy/boss
 *
 * Boss 内容数据唯一入口。
 * ChapterWaveController 只选择 BossId；EnemyController 仍拥有敌人生命、
 * 死亡与掉落；BossRuntimeController 只消费这里的阶段和技能定义。
 */
export type BossId =
    | 'flame_dragon';

export type BossSkillId =
    | 'flame_breath'
    | 'tail_sweep'
    | 'meteor_rain';

export type BossSkillTargetMode =
    | 'target_area'
    | 'self_area';

export interface BossSkillDefinition {
    id: BossSkillId;
    displayName: string;
    targetMode: BossSkillTargetMode;
    castSeconds: number;
    cooldownSeconds: number;
    radius: number;
    damageMultiplier: number;
}

export interface BossPhaseDefinition {
    /** 进入本阶段所需的生命比例上限。 */
    hpThreshold: number;
    displayName: string;
    moveSpeedMultiplier: number;
    attackIntervalMultiplier: number;
    skills: readonly BossSkillId[];
}

export interface BossDefinition {
    id: BossId;
    displayName: string;
    title: string;
    spriteFramePath: string;
    skills: Readonly<Record<BossSkillId, BossSkillDefinition>>;
    phases: readonly BossPhaseDefinition[];
}

const FLAME_DRAGON:
    BossDefinition = {
        id: 'flame_dragon',
        displayName: '赤金炎龙',
        title: '焰岩之王',
        spriteFramePath:
            'enemies/bosses/flame_dragon/sprite/flame_dragon_battle/spriteFrame',
        skills: {
            flame_breath: {
                id: 'flame_breath',
                displayName: '龙炎吐息',
                targetMode: 'target_area',
                castSeconds: 0.9,
                cooldownSeconds: 5.6,
                radius: 150,
                damageMultiplier: 1.35,
            },
            tail_sweep: {
                id: 'tail_sweep',
                displayName: '焰尾横扫',
                targetMode: 'self_area',
                castSeconds: 0.7,
                cooldownSeconds: 4.8,
                radius: 132,
                damageMultiplier: 1.05,
            },
            meteor_rain: {
                id: 'meteor_rain',
                displayName: '陨石火雨',
                targetMode: 'target_area',
                castSeconds: 1.2,
                cooldownSeconds: 6.4,
                radius: 215,
                damageMultiplier: 1.65,
            },
        },
        phases: [
            {
                hpThreshold: 1,
                displayName: '灼翼',
                moveSpeedMultiplier: 1,
                attackIntervalMultiplier: 1,
                skills: [
                    'flame_breath',
                ],
            },
            {
                hpThreshold: 0.7,
                displayName: '熔甲',
                moveSpeedMultiplier: 1.08,
                attackIntervalMultiplier: 0.9,
                skills: [
                    'tail_sweep',
                    'flame_breath',
                ],
            },
            {
                hpThreshold: 0.38,
                displayName: '焚城',
                moveSpeedMultiplier: 1.16,
                attackIntervalMultiplier: 0.78,
                skills: [
                    'meteor_rain',
                    'flame_breath',
                    'tail_sweep',
                ],
            },
        ],
    };

const BOSS_DEFINITIONS:
    Readonly<Record<BossId, BossDefinition>> = {
        flame_dragon:
            FLAME_DRAGON,
    };

export function getBossDefinition(
    id: BossId,
): BossDefinition {
    return BOSS_DEFINITIONS[id];
}
