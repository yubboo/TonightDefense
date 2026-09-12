/**
 * @architecture TonightDefense V1.0
 * @owner level
 * @module map
 *
 * 战斗地图主题的唯一数据入口。
 *
 * 地图只决定章节对应的视觉主题、文案与装饰密度；
 * 角色移动、泉水、阵型与防线坐标继续由 BattleLayoutConfig 统一维护，
 * 避免关卡系统和战斗系统各保存一份坐标。
 */

export type BattleMapId =
    | 'royal_frontier'
    | 'dark_wood'
    | 'frost_pass'
    | 'dragon_siege';

export type BattleMapColor =
    readonly [
        number,
        number,
        number,
        number,
    ];

export interface BattleMapPalette {
    ground: BattleMapColor;
    enemyZone: BattleMapColor;
    battleZone: BattleMapColor;
    defenseZone: BattleMapColor;
    foundation: BattleMapColor;
    road: BattleMapColor;
    roadEdge: BattleMapColor;
    foliage: BattleMapColor;
    foliageDark: BattleMapColor;
    accent: BattleMapColor;
}

export interface BattleMapDefinition {
    id: BattleMapId;
    name: string;
    subtitle: string;
    chapterFrom: number;
    chapterTo: number;
    decorationSeed: number;
    palette: BattleMapPalette;
}

export const BATTLE_MAP_CATALOG:
    readonly BattleMapDefinition[] = [
        {
            id: 'royal_frontier',
            name: '王城前境',
            subtitle: '林地古道 · 守护王城',
            chapterFrom: 1,
            chapterTo: 10,
            decorationSeed: 11,
            palette: {
                ground: [199, 218, 170, 255],
                enemyZone: [160, 194, 132, 255],
                battleZone: [218, 220, 174, 255],
                defenseZone: [225, 211, 169, 255],
                foundation: [145, 151, 144, 255],
                road: [225, 210, 164, 255],
                roadEdge: [165, 151, 111, 210],
                foliage: [92, 139, 78, 255],
                foliageDark: [58, 103, 67, 255],
                accent: [57, 142, 221, 255],
            },
        },
        {
            id: 'dark_wood',
            name: '幽影密林',
            subtitle: '月影古道 · 雾中来袭',
            chapterFrom: 11,
            chapterTo: 20,
            decorationSeed: 29,
            palette: {
                ground: [129, 155, 123, 255],
                enemyZone: [92, 119, 103, 255],
                battleZone: [145, 163, 129, 255],
                defenseZone: [166, 165, 128, 255],
                foundation: [102, 111, 112, 255],
                road: [166, 160, 126, 255],
                roadEdge: [89, 104, 87, 220],
                foliage: [51, 91, 72, 255],
                foliageDark: [35, 62, 58, 255],
                accent: [112, 121, 220, 255],
            },
        },
        {
            id: 'frost_pass',
            name: '霜风隘口',
            subtitle: '雪原关隘 · 寒潮压境',
            chapterFrom: 21,
            chapterTo: 30,
            decorationSeed: 47,
            palette: {
                ground: [190, 210, 214, 255],
                enemyZone: [153, 184, 194, 255],
                battleZone: [208, 221, 217, 255],
                defenseZone: [220, 218, 201, 255],
                foundation: [135, 153, 163, 255],
                road: [210, 207, 184, 255],
                roadEdge: [126, 151, 160, 215],
                foliage: [92, 133, 139, 255],
                foliageDark: [63, 98, 111, 255],
                accent: [89, 185, 232, 255],
            },
        },
        {
            id: 'dragon_siege',
            name: '焰龙焦土',
            subtitle: '熔岩古道 · 关底决战',
            chapterFrom: 31,
            chapterTo: Number.MAX_SAFE_INTEGER,
            decorationSeed: 73,
            palette: {
                ground: [126, 104, 88, 255],
                enemyZone: [102, 72, 63, 255],
                battleZone: [148, 119, 91, 255],
                defenseZone: [166, 137, 101, 255],
                foundation: [92, 87, 85, 255],
                road: [173, 145, 105, 255],
                roadEdge: [101, 66, 55, 225],
                foliage: [103, 87, 65, 255],
                foliageDark: [67, 58, 54, 255],
                accent: [232, 93, 48, 255],
            },
        },
    ] as const;

export function getBattleMapDefinition(
    chapterNumber: number,
): BattleMapDefinition {
    const chapter =
        Math.max(
            1,
            Math.floor(
                chapterNumber,
            ),
        );

    return BATTLE_MAP_CATALOG.find(
        (map) =>
            chapter >= map.chapterFrom &&
            chapter <= map.chapterTo,
    ) ?? BATTLE_MAP_CATALOG[0];
}
