/**
 * @architecture TonightDefense V1.0
 * @owner battle
 * @module data
 */
import {
    Vec2,
} from 'cc';

import {
    ProfessionAttackMode,
} from '../../hero/profession/definition/ProfessionTypes';

import {
    getProfessionById,
} from '../../hero/profession/definition/ProfessionCatalog';

import {
    getCharacterById,
} from '../../hero/character/data/CharacterCatalog';

/**
 * 兼容旧接口名称。
 * 战斗角色的攻击方式真正由 ProfessionSystem 统一决定。
 */
export type CompanionAttackMode =
    ProfessionAttackMode;

/**
 * 兼容旧接口名称。
 * 新代码不再把“伙伴战斗参数”维护成第二套数据源；
 * 这里仅把 Character -> Profession 的结果映射成旧结构。
 */
export interface CompanionCombatProfile {
    mode:
        CompanionAttackMode;

    damage:
        number;

    attackInterval:
        number;

    attackRange:
        number;

    projectileSpeed:
        number;
}

export const BATTLE_LAYOUT = {
    /**
     * 有边界的竖屏守城战场。
     * v0.6.3 后逻辑地图直接使用正式 9:16 背景坐标系；左右仍保留拉扯空间，
     * 上方是怪物区与主战区，下方固定为玩家防守区。
     */
    map: {
        infinite: false,
        /**
         * v0.6.3：战场逻辑尺寸与正式 900 × 1600（9:16）背景一一对应。
         * 不再让 9:16 背景以 cover 方式塞进 2200 × 2300 的近方形世界，
         * 避免背景实际高度被放大到约 3911，手机视口只看到中间一小块。
         */
        width: 900,
        height: 1600,

        /**
         * 视觉/玩法分区：
         * y >= enemyZoneMinY：怪物出没区 / 主角可主动堵泉水区域。
         * mainZoneMinY ~ enemyZoneMinY：主战场 / 大乱斗区。
         * defenseZoneMinY ~ mainZoneMinY：玩家防守区。
         */
        enemyZoneMinY: 174,
        mainZoneMinY: -160,
        defenseZoneMinY: -682,
    },

    view: {
        /**
         * 720 × 1280 设计视口下的回退缩放。
         * 实际运行时由 BattleWorldService 按设备可见尺寸动态执行 cover：
         * max(viewportWidth / 900, viewportHeight / 1600)。
         */
        worldScale: 0.8,

        /** 主角默认略偏下，给上方来怪留更多视野。 */
        heroScreenY: -110,

        /** 左右移动进入安全区边缘后镜头跟随。 */
        deadZoneX: 78,
        deadZoneY: 88,

        /** 向下最多回到出生基线，不继续越过底部防守区。 */
        followDown: false,

        /** 指数平滑强度。 */
        followSharpness: 7.2,

        /** 720 x 1280 设计分辨率的一半。 */
        viewportHalfWidth: 360,
        viewportHalfHeight: 640,
    },

    /** 玩家开局处于整支队伍最前方的中轴 C 位。 */
    heroSpawn:
        new Vec2(
            0,
            -28,
        ),


    /** 主角阵亡后由防御塔复活到固定主角阵位。 */
    mainHeroReviveAnchor:
        new Vec2(
            0,
            -28,
        ),

    /**
     * 所有英雄共用的物理战场活动边界。
     * v0.6.6 起 AI 英雄不再拥有独立寻怪/交战区域；主角与伙伴都可以进入上半区。
     */
    heroMoveBounds: {
        /**
         * v0.6.6：玩家主角与 AI 英雄共用同一套物理战场边界。
         * 这只是地图不可穿越边缘，不再作为 AI 寻怪/交战区域限制。
         */
        minX: -390,
        maxX: 390,
        minY: -452,
        maxY: 690,
    },

    /**
     * 上半区 5 个固定怪物泉水/入口。
     * 每次刷怪根据主角当前 X，优先选择最接近主角的入口与左右相邻入口，
     * 因而整体表现为左上 / 上 / 右上来袭。
     */
    enemySpawn: {
        fountains: [
            new Vec2(-319, 598),
            new Vec2(-160, 633),
            new Vec2(0, 654),
            new Vec2(160, 633),
            new Vec2(319, 598),
        ],

        jitterX: 17,
        jitterY: 20,
    },

    /**
     * 四名 AI 英雄的固定出生/复活阵位：
     *
     * 伙伴1    伙伴2    伙伴3
     *          伙伴4（远程后排）
     *
     * 主角在这组阵位前方的中轴 C 位。
     * “伙伴”只是 AI 控制模式；人物本身仍来自统一 CharacterCatalog。
     */
    companionAnchors: [
        new Vec2(-119, -139),
        new Vec2(0, -157),
        new Vec2(119, -139),
        new Vec2(0, -219),
    ],

    /** 复活位置与固定出生位完全一致。 */
    companionReviveAnchors: [
        new Vec2(-119, -139),
        new Vec2(0, -157),
        new Vec2(119, -139),
        new Vec2(0, -219),
    ],

    /**
     * v0.6.6：AI 英雄不再有独立活动/寻怪区域。
     * 伙伴和主角共用 heroMoveBounds 作为纯物理地图边界。
     */

    /** 无怪时只在各自固定阵位附近做小范围巡逻。 */
    companionGuardPatrolRadiusX: 51,
    companionGuardPatrolRadiusY: 61,


    companionPatrolPauseMin: 0.55,
    companionPatrolPauseMax: 1.45,

    /**
     * 单个英雄（主角或 AI）复活全过程约 4 秒，总计消耗 200 点雕像生命。
     * 消耗与生命恢复按时间连续发生。
     */
    heroRevive: {
        duration: 4,
        totalTowerHpCost: 200,
        initialHpRatio: 0.04,
    },

    defenseTower:
        new Vec2(
            0,
            -299,
        ),

    wall:
        new Vec2(
            0,
            -379,
        ),

    princess:
        new Vec2(
            0,
            -438,
        ),
} as const;

/**
 * 旧接口兼容层。
 *
 * CharacterCatalog + ProfessionCatalog 是所有英雄（玩家主角 / AI 伙伴）的唯一战斗数据源。
 * 新增英雄只需要在 CharacterCatalog 指向一个 professionId；
 * 不再在 BattleLayoutConfig 维护第二份“伙伴专属伤害/攻速/射程”表。
 */
export function getCompanionCombatProfile(
    companionId:
        string,
): CompanionCombatProfile {
    const character =
        getCharacterById(
            companionId,
        );

    if (character) {
        const profession =
            getProfessionById(
                character
                    .professionId,
            );

        return {
            mode:
                profession.attackMode,
            damage:
                profession
                    .baseStats
                    .attackPower,
            attackInterval:
                profession.attackInterval,
            attackRange:
                profession.attackRange,
            projectileSpeed:
                profession.projectileSpeed,
        };
    }

    /**
     * 只有历史脏数据/缺失人物时才会走这里；
     * 正常角色永远从 ProfessionSystem 读取。
     */
    return {
        mode: 'melee',
        damage: 7,
        attackInterval: 0.9,
        attackRange: 60,
        projectileSpeed: 0,
    };
}
