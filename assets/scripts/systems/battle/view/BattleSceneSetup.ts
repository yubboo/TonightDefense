/**
 * @architecture TonightDefense V1.0
 * @owner battle
 * @module view
 */
import {
    _decorator,
    Color,
    Component,
    Graphics,
    Layers,
    Node,
    UITransform,
} from 'cc';
import { BATTLE_LAYOUT } from '../data/BattleLayoutConfig';
import { BattleWorldService } from './BattleWorldService';
import { GameplaySessionState } from '../../gameplay/runtime/GameplaySessionState';
import {
    BattleMapColor,
    BattleMapDefinition,
    getBattleMapDefinition,
} from '../../level/map/BattleMapCatalog';

import {
    BattleArt,
} from '../../../ui/resources/BattleArt';

const { ccclass } = _decorator;

/**
 * 《今晚守城》
 * 正式战斗场景视觉构建入口。
 *
 * 修正：
 * - 不再画“左上出怪区/伙伴1/伙伴2”等调试中文和红框。
 * - 不再画假的白色敌人。
 * - 不再画假的友军。
 * - 场上的英雄/伙伴/怪物全部由真正的运行逻辑生成。
 * - 保留：草地、道路、顶部HUD、底部卡栏、防御塔/城墙/公主占位。
 */
@ccclass('BattleSceneSetup')
export class BattleSceneSetup extends Component {

    private mapDefinition!:
        BattleMapDefinition;

    start(): void {
        const canvas = this.node.parent;

        if (!canvas) {
            console.error(
                '[今晚守城] BattleSceneSetup 找不到 Canvas',
            );
            return;
        }

        canvas.layer = Layers.Enum.UI_2D;
        this.node.layer = Layers.Enum.UI_2D;

        this.mapDefinition =
            getBattleMapDefinition(
                GameplaySessionState
                    .get()
                    .chapterNumber,
            );

        const old =
            canvas.getChildByName(
                'BattleSceneRoot',
            );

        if (old) {
            old.destroy();
        }

        this.createScene(canvas);

        console.log(
            `[今晚守城] 战斗地图：${this.mapDefinition.name} / ${this.mapDefinition.subtitle}`,
        );
    }

    private createScene(
        canvas: Node,
    ): void {
        const worldRoot =
            BattleWorldService.ensure(
                canvas,
            );

        const old =
            worldRoot.getChildByName(
                'BattleSceneRoot',
            );

        if (old) {
            old.destroy();
        }

        /**
         * 兼容旧版本热重载后直接挂在 Canvas 下的战场根节点。
         */
        const legacyOld =
            canvas.getChildByName(
                'BattleSceneRoot',
            );

        if (legacyOld) {
            legacyOld.destroy();
        }

        const root =
            new Node(
                'BattleSceneRoot',
            );

        root.layer =
            Layers.Enum.UI_2D;

        worldRoot.addChild(root);
        root.setSiblingIndex(0);

        root.addComponent(
            UITransform,
        ).setContentSize(
            BATTLE_LAYOUT.map.width,
            BATTLE_LAYOUT.map.height,
        );

        this.drawBackground(root);
        this.createTopHud(root);
        this.drawDefenseLine(root);

        /** 旧版四卡灰色 BottomPanel 已由正式 BattlePartyHUD 取代。 */
        const oldBottom =
            canvas.getChildByName(
                'BottomPanel',
            );

        if (oldBottom) {
            oldBottom.destroy();
        }
    }

    private drawBackground(
        parent: Node,
    ): void {
        const root =
            new Node(
                'Background',
            );

        root.layer =
            Layers.Enum.UI_2D;

        parent.addChild(root);
        root.setSiblingIndex(0);

        const map =
            BATTLE_LAYOUT.map;

        const halfWidth =
            map.width / 2;

        const halfHeight =
            map.height / 2;

        const palette =
            this.mapDefinition
                .palette;

        const g =
            root.addComponent(
                Graphics,
            );

        /** 整张有限战场底色。 */
        g.fillColor =
            this.toColor(
                palette.ground,
            );

        g.rect(
            -halfWidth,
            -halfHeight,
            map.width,
            map.height,
        );
        g.fill();

        /**
         * 上半区：怪物出没区 + 可堵泉水的交战区。
         * 稍深的草绿色帮助玩家一眼判断“往上就是危险区”。
         */
        g.fillColor =
            this.toColor(
                palette.enemyZone,
            );

        g.rect(
            -halfWidth,
            map.enemyZoneMinY,
            map.width,
            halfHeight -
                map.enemyZoneMinY,
        );
        g.fill();

        /** 中间主战场：保持开阔，给大乱斗留空间。 */
        g.fillColor =
            this.toColor(
                palette.battleZone,
            );

        g.rect(
            -halfWidth,
            map.mainZoneMinY,
            map.width,
            map.enemyZoneMinY -
                map.mainZoneMinY,
        );
        g.fill();

        /** 下半区玩家防守区：偏暖，和主战区形成自然分界。 */
        g.fillColor =
            this.toColor(
                palette.defenseZone,
            );

        g.rect(
            -halfWidth,
            map.defenseZoneMinY,
            map.width,
            map.mainZoneMinY -
                map.defenseZoneMinY,
        );
        g.fill();

        /** 最底部据点地基。 */
        g.fillColor =
            this.toColor(
                palette.foundation,
            );

        g.rect(
            -halfWidth,
            -halfHeight,
            map.width,
            map.defenseZoneMinY +
                halfHeight,
        );
        g.fill();

        this.drawRoyalRoad(
            g,
            halfHeight,
        );

        this.drawGroundDetails(
            g,
            halfWidth,
            halfHeight,
        );

        this.drawBattlefieldBoundaries(
            g,
            halfWidth,
            halfHeight,
        );

        this.drawEnemyFountains(
            root,
        );

        BattleArt.attach(
            root,
            'map-ground',
            map.width,
            map.height,
            'cover',
        );
    }

    private drawBattlefieldBoundaries(
        g: Graphics,
        halfWidth: number,
        halfHeight: number,
    ): void {
        /** 左右边界用密集树丛/岩石形成不可穿越视觉墙。 */
        g.fillColor =
            this.toColor(
                this.mapDefinition
                    .palette
                    .foliage,
            );

        for (
            let y =
                -halfHeight + 70;
            y <=
                halfHeight - 70;
            y += 125
        ) {
            const wobble =
                Math.sin(
                    y * 0.017,
                ) *
                22;

            g.circle(
                -halfWidth + 38 +
                    wobble,
                y,
                62,
            );
            g.fill();

            g.circle(
                halfWidth - 38 -
                    wobble,
                y + 28,
                62,
            );
            g.fill();
        }

        /** 上边界稍短，形成明确的怪物泉水后场。 */
        g.fillColor =
            this.toColor(
                this.mapDefinition
                    .palette
                    .foliageDark,
            );

        for (
            let x =
                -halfWidth + 85;
            x <=
                halfWidth - 85;
            x += 145
        ) {
            g.circle(
                x,
                halfHeight - 36,
                66,
            );
            g.fill();
        }

        /** 防守区分隔线。 */
        g.strokeColor =
            this.toColor(
                this.mapDefinition
                    .palette
                    .roadEdge,
            );
        g.lineWidth = 4;
        g.moveTo(
            -halfWidth + 150,
            BATTLE_LAYOUT
                .map
                .mainZoneMinY,
        );
        g.lineTo(
            halfWidth - 150,
            BATTLE_LAYOUT
                .map
                .mainZoneMinY,
        );
        g.stroke();
    }

    private drawEnemyFountains(
        parent: Node,
    ): void {
        const fountains =
            BATTLE_LAYOUT
                .enemySpawn
                .fountains;

        for (
            let i = 0;
            i < fountains.length;
            i += 1
        ) {
            const point =
                fountains[i];

            const node =
                new Node(
                    `EnemyFountain_${i}`,
                );

            node.layer =
                Layers.Enum.UI_2D;
            parent.addChild(node);
            node.setPosition(
                point.x,
                point.y,
                0,
            );

            const g =
                node.addComponent(
                    Graphics,
                );

            g.fillColor =
                new Color(
                    77,
                    87,
                    102,
                    120,
                );
            g.circle(
                0,
                0,
                54,
            );
            g.fill();

            g.fillColor =
                new Color(
                    101,
                    92,
                    171,
                    205,
                );
            g.circle(
                0,
                0,
                39,
            );
            g.fill();

            g.fillColor =
                this.toColor(
                    this.mapDefinition
                        .palette
                        .accent,
                    205,
                );
            g.circle(
                0,
                3,
                24,
            );
            g.fill();

            g.strokeColor =
                new Color(
                    225,
                    220,
                    173,
                    220,
                );
            g.lineWidth = 4;
            g.circle(
                0,
                0,
                48,
            );
            g.stroke();
        }
    }

    /** 中央道路把泉水、交战区与王城防线连成一条清晰战斗轴。 */
    private drawRoyalRoad(
        g: Graphics,
        halfHeight: number,
    ): void {
        const palette =
            this.mapDefinition
                .palette;

        g.fillColor =
            this.toColor(
                palette.road,
            );

        g.moveTo(
            -430,
            -halfHeight,
        );
        g.bezierCurveTo(
            -510,
            -520,
            -360,
            250,
            -270,
            halfHeight,
        );
        g.lineTo(
            270,
            halfHeight,
        );
        g.bezierCurveTo(
            360,
            250,
            510,
            -520,
            430,
            -halfHeight,
        );
        g.close();
        g.fill();

        g.strokeColor =
            this.toColor(
                palette.roadEdge,
            );
        g.lineWidth = 8;

        g.moveTo(
            -430,
            -halfHeight,
        );
        g.bezierCurveTo(
            -510,
            -520,
            -360,
            250,
            -270,
            halfHeight,
        );

        g.moveTo(
            430,
            -halfHeight,
        );
        g.bezierCurveTo(
            510,
            -520,
            360,
            250,
            270,
            halfHeight,
        );
        g.stroke();

        /** 规则错开的浅色石板，保持低绘制成本同时增加地图质感。 */
        for (
            let y = -1040;
            y <= 1040;
            y += 105
        ) {
            const width =
                420 -
                Math.abs(y) *
                    0.035;

            const offset =
                Math.sin(
                    (y +
                        this.mapDefinition
                            .decorationSeed) *
                        0.032,
                ) *
                42;

            g.fillColor =
                new Color(
                    255,
                    247,
                    214,
                    32,
                );

            g.roundRect(
                -width / 2 +
                    offset,
                y - 15,
                width,
                30,
                9,
            );
            g.fill();
        }
    }

    private drawGroundDetails(
        g: Graphics,
        halfWidth: number,
        halfHeight: number,
    ): void {
        const seed =
            this.mapDefinition
                .decorationSeed;

        for (
            let i = 0;
            i < 44;
            i += 1
        ) {
            const y =
                -halfHeight +
                90 +
                ((i * 173 +
                    seed * 19) %
                    Math.floor(
                        halfHeight * 2 -
                            180,
                    ));

            const side =
                i % 2 === 0
                    ? -1
                    : 1;

            const x =
                side *
                (520 +
                    ((i * 97 +
                        seed * 13) %
                        Math.max(
                            120,
                            halfWidth - 610,
                        )));

            g.fillColor =
                i % 3 === 0
                    ? this.toColor(
                        this.mapDefinition
                            .palette
                            .foliageDark,
                        100,
                    )
                    : new Color(
                        245,
                        232,
                        148,
                        82,
                    );

            g.circle(
                x,
                y,
                7 +
                    (i % 4) * 2,
            );
            g.fill();
        }
    }

    private toColor(
        value: BattleMapColor,
        alpha = value[3],
    ): Color {
        return new Color(
            value[0],
            value[1],
            value[2],
            alpha,
        );
    }

    private createTopHud(
        _parent: Node,
    ): void {
        /**
         * 顶部 HUD 已正式迁移到：
         * ui/hud/ChapterWaveHUD.ts
         *
         * 原型层不再绘制顶部背景、暂停按钮、倍速按钮，
         * 避免与正式 HUD 重复叠加。
         */
    }

    private drawDefenseLine(
        parent: Node,
    ): void {
        const node =
            new Node(
                'DefenseLine',
            );

        node.layer =
            Layers.Enum.UI_2D;

        parent.addChild(node);

        const g =
            node.addComponent(
                Graphics,
            );

        let formalAssetsReady = 0;
        const hidePrototype =
            () => {
                formalAssetsReady += 1;

                if (formalAssetsReady >= 3) {
                    g.enabled = false;
                }
            };

        const wallArt =
            BattleArt.attach(
                node,
                'royal-wall',
                760,
                300,
                'contain',
                hidePrototype,
                false,
            );
        wallArt.setPosition(
            BATTLE_LAYOUT.wall.x,
            BATTLE_LAYOUT.wall.y,
            0,
        );

        const towerArt =
            BattleArt.attach(
                node,
                'guardian-tower',
                190,
                190,
                'contain',
                hidePrototype,
                false,
            );
        towerArt.setPosition(
            BATTLE_LAYOUT.defenseTower.x,
            BATTLE_LAYOUT.defenseTower.y + 42,
            0,
        );

        const princessArt =
            BattleArt.attach(
                node,
                'princess',
                145,
                160,
                'contain',
                hidePrototype,
                false,
            );
        princessArt.setPosition(
            BATTLE_LAYOUT.princess.x,
            BATTLE_LAYOUT.princess.y,
            0,
        );

        /** 三人横排 + 一人远程后排的固定守城/复活阵位。 */
        for (
            let i = 0;
            i < BATTLE_LAYOUT
                .companionReviveAnchors
                .length;
            i += 1
        ) {
            const anchor =
                BATTLE_LAYOUT
                    .companionReviveAnchors[i];

            g.fillColor =
                new Color(
                    136,
                    190,
                    198,
                    72,
                );
            g.circle(
                anchor.x,
                anchor.y,
                39,
            );
            g.fill();

            g.strokeColor =
                new Color(
                    112,
                    190,
                    205,
                    190,
                );
            g.lineWidth = 3;
            g.circle(
                anchor.x,
                anchor.y,
                34,
            );
            g.stroke();

            g.strokeColor =
                new Color(
                    225,
                    218,
                    170,
                    170,
                );
            g.lineWidth = 2;
            g.circle(
                anchor.x,
                anchor.y,
                24,
            );
            g.stroke();
        }

        /**
         * 防御塔：守护雕像原型。
         * 正式美术阶段再替换成分阶段损坏 Sprite。
         */
        const tower =
            BATTLE_LAYOUT
                .defenseTower;

        // 石座
        g.fillColor =
            new Color(
                70,
                82,
                100,
                255,
            );

        g.roundRect(
            tower.x - 48,
            tower.y - 43,
            96,
            24,
            6,
        );

        g.fill();

        g.fillColor =
            new Color(
                201,
                166,
                72,
                255,
            );

        g.roundRect(
            tower.x - 37,
            tower.y - 22,
            74,
            22,
            7,
        );

        g.fill();

        // 雕像躯干/披风
        g.fillColor =
            new Color(
                43,
                86,
                148,
                255,
            );

        g.moveTo(
            tower.x - 30,
            tower.y - 5,
        );

        g.lineTo(
            tower.x - 20,
            tower.y + 48,
        );

        g.lineTo(
            tower.x,
            tower.y + 63,
        );

        g.lineTo(
            tower.x + 20,
            tower.y + 48,
        );

        g.lineTo(
            tower.x + 30,
            tower.y - 5,
        );

        g.close();
        g.fill();

        // 肩甲
        g.fillColor =
            new Color(
                177,
                183,
                188,
                255,
            );

        g.circle(
            tower.x - 24,
            tower.y + 42,
            13,
        );

        g.circle(
            tower.x + 24,
            tower.y + 42,
            13,
        );

        g.fill();

        // 石像头部
        g.fillColor =
            new Color(
                188,
                192,
                194,
                255,
            );

        g.circle(
            tower.x,
            tower.y + 70,
            15,
        );

        g.fill();

        // 守护尖冠
        g.fillColor =
            new Color(
                126,
                134,
                142,
                255,
            );

        g.moveTo(
            tower.x - 17,
            tower.y + 81,
        );

        g.lineTo(
            tower.x - 8,
            tower.y + 101,
        );

        g.lineTo(
            tower.x,
            tower.y + 87,
        );

        g.lineTo(
            tower.x + 8,
            tower.y + 101,
        );

        g.lineTo(
            tower.x + 17,
            tower.y + 81,
        );

        g.close();
        g.fill();

        // 胸口晶石
        g.fillColor =
            new Color(
                96,
                215,
                232,
                255,
            );

        g.moveTo(
            tower.x,
            tower.y + 47,
        );

        g.lineTo(
            tower.x + 8,
            tower.y + 36,
        );

        g.lineTo(
            tower.x,
            tower.y + 25,
        );

        g.lineTo(
            tower.x - 8,
            tower.y + 36,
        );

        g.close();
        g.fill();

        // 雕像长杖
        g.strokeColor =
            new Color(
                113,
                119,
                125,
                255,
            );

        g.lineWidth = 6;

        g.moveTo(
            tower.x + 34,
            tower.y - 10,
        );

        g.lineTo(
            tower.x + 42,
            tower.y + 84,
        );

        g.stroke();

        g.fillColor =
            new Color(
                103,
                219,
                237,
                255,
            );

        g.circle(
            tower.x + 43,
            tower.y + 92,
            7,
        );

        g.fill();

        // 城墙
        const wall =
            BATTLE_LAYOUT.wall;

        g.fillColor =
            new Color(
                117,
                126,
                137,
                255,
            );

        g.roundRect(
            -420,
            wall.y - 24,
            840,
            48,
            6,
        );

        g.fill();

        g.fillColor =
            new Color(
                164,
                164,
                164,
                255,
            );

        for (
            let x = -405;
            x <= 365;
            x += 55
        ) {
            g.rect(
                x,
                wall.y + 20,
                32,
                18,
            );

            g.fill();
        }

        g.strokeColor =
            new Color(
                47,
                76,
                123,
                255,
            );
        g.lineWidth = 7;
        g.moveTo(
            -410,
            wall.y - 3,
        );
        g.lineTo(
            410,
            wall.y - 3,
        );
        g.stroke();

        // 公主占位
        const princess =
            BATTLE_LAYOUT.princess;

        g.fillColor =
            new Color(
                243,
                215,
                221,
                255,
            );

        g.circle(
            princess.x,
            princess.y + 19,
            13,
        );

        g.fill();

        g.fillColor =
            new Color(
                222,
                146,
                174,
                255,
            );

        g.moveTo(
            princess.x - 20,
            princess.y - 30,
        );

        g.lineTo(
            princess.x,
            princess.y + 10,
        );

        g.lineTo(
            princess.x + 20,
            princess.y - 30,
        );

        g.close();
        g.fill();

        g.fillColor =
            new Color(
                241,
                193,
                69,
                255,
            );

        g.moveTo(
            princess.x - 12,
            princess.y + 30,
        );

        g.lineTo(
            princess.x - 6,
            princess.y + 43,
        );

        g.lineTo(
            princess.x,
            princess.y + 32,
        );

        g.lineTo(
            princess.x + 6,
            princess.y + 43,
        );

        g.lineTo(
            princess.x + 12,
            princess.y + 30,
        );

        g.close();
        g.fill();
    }

}
