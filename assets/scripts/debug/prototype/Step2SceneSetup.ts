/**
 * @architecture TonightDefense V1.0
 * @owner debug
 * @module prototype
 * @migratedFrom core/Step2SceneSetup.ts
 */
import {
    _decorator,
    Color,
    Component,
    Graphics,
    Label,
    Layers,
    Node,
    UITransform,
} from 'cc';
import { BATTLE_LAYOUT } from '../../systems/battle/data/BattleLayoutConfig';
import { BattleWorldService } from '../../systems/battle/view/BattleWorldService';

const { ccclass } = _decorator;

/**
 * 《今晚守城》
 * 场景视觉基线 V0.3
 *
 * 修正：
 * - 不再画“左上出怪区/伙伴1/伙伴2”等调试中文和红框。
 * - 不再画假的白色敌人。
 * - 不再画假的友军。
 * - 场上的英雄/伙伴/怪物全部由真正的运行逻辑生成。
 * - 保留：草地、道路、顶部HUD、底部卡栏、防御塔/城墙/公主占位。
 */
@ccclass('Step2SceneSetup')
export class Step2SceneSetup extends Component {

    start(): void {
        const canvas = this.node.parent;

        if (!canvas) {
            console.error(
                '[今晚守城] Step2SceneSetup 找不到 Canvas',
            );
            return;
        }

        canvas.layer = Layers.Enum.UI_2D;
        this.node.layer = Layers.Enum.UI_2D;

        const old =
            canvas.getChildByName(
                'BattleSceneRoot',
            );

        if (old) {
            old.destroy();
        }

        this.createScene(canvas);

        console.log(
            '[今晚守城] 战场视觉已清理：无调试出怪框/伙伴位置文字/假单位',
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

        /**
         * BottomPanel 是屏幕 UI，不属于世界坐标。
         * 保持直接挂 Canvas，避免镜头移动时跟着地图漂移。
         */
        const oldBottom =
            canvas.getChildByName(
                'BottomPanel',
            );

        if (oldBottom) {
            oldBottom.destroy();
        }

        this.createBottomPanel(canvas);
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

        const g =
            root.addComponent(
                Graphics,
            );

        /** 整张有限战场底色。 */
        g.fillColor =
            new Color(
                208,
                219,
                176,
                255,
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
            new Color(
                188,
                211,
                158,
                245,
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
            new Color(
                220,
                224,
                184,
                245,
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
            new Color(
                226,
                216,
                177,
                255,
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
            new Color(
                184,
                181,
                157,
                255,
            );

        g.rect(
            -halfWidth,
            -halfHeight,
            map.width,
            map.defenseZoneMinY +
                halfHeight,
        );
        g.fill();

        /** 主战场磨损带，避免整块地图像纯色程序底板。 */
        g.fillColor =
            new Color(
                234,
                225,
                184,
                120,
            );

        g.roundRect(
            -620,
            -185,
            1240,
            720,
            250,
        );
        g.fill();

        g.fillColor =
            new Color(
                238,
                231,
                194,
                90,
            );

        g.roundRect(
            -470,
            350,
            940,
            480,
            210,
        );
        g.fill();

        this.drawBattlefieldBoundaries(
            g,
            halfWidth,
            halfHeight,
        );

        this.drawEnemyFountains(
            root,
        );
    }

    private drawBattlefieldBoundaries(
        g: Graphics,
        halfWidth: number,
        halfHeight: number,
    ): void {
        /** 左右边界用密集树丛/岩石形成不可穿越视觉墙。 */
        g.fillColor =
            new Color(
                112,
                151,
                94,
                255,
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
            new Color(
                99,
                137,
                83,
                255,
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
            new Color(
                171,
                151,
                111,
                165,
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
                new Color(
                    135,
                    202,
                    230,
                    175,
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

        /**
         * 四个固定伙伴复活位：平时就是防守区地面上的能量阵位，
         * 阵亡伙伴会回到自己对应的位置接受雕像持续传输。
         */
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
                138,
                145,
                151,
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
                164,
                170,
                176,
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
                153,
                160,
                166,
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
                139,
                139,
                139,
                255,
            );

        g.roundRect(
            -250,
            wall.y - 24,
            500,
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
            let x = -235;
            x <= 205;
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

    private createBottomPanel(
        parent: Node,
    ): void {
        const panel =
            new Node(
                'BottomPanel',
            );

        panel.layer =
            Layers.Enum.UI_2D;

        parent.addChild(panel);

        const g =
            panel.addComponent(Graphics);

        g.fillColor =
            new Color(
                210,
                210,
                210,
                255,
            );

        g.rect(
            -360,
            -640,
            720,
            95,
        );

        g.fill();

        // 卡槽占位
        for (
            let i = 0;
            i < 4;
            i += 1
        ) {
            const x =
                -250 +
                i * 165;

            g.fillColor =
                i < 2
                    ? new Color(
                        235,
                        220,
                        208,
                        255,
                    )
                    : new Color(
                        177,
                        177,
                        177,
                        255,
                    );

            g.roundRect(
                x,
                -626,
                125,
                72,
                7,
            );

            g.fill();

            g.strokeColor =
                new Color(
                    44,
                    44,
                    44,
                    255,
                );

            g.lineWidth = 3;

            g.roundRect(
                x,
                -626,
                125,
                72,
                7,
            );

            g.stroke();
        }
    }

    private createSmallButton(
        parent: Node,
        x: number,
        y: number,
        text: string,
    ): void {
        const node =
            new Node('HudButton');

        node.layer =
            Layers.Enum.UI_2D;

        parent.addChild(node);

        node.setPosition(
            x,
            y,
            0,
        );

        node.addComponent(
            UITransform,
        ).setContentSize(
            56,
            56,
        );

        const g =
            node.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                247,
                247,
                247,
                255,
            );

        g.roundRect(
            -28,
            -28,
            56,
            56,
            5,
        );

        g.fill();

        this.createLabel(
            node,
            text,
            0,
            0,
            28,
            50,
        );
    }

    private createLabel(
        parent: Node,
        text: string,
        x: number,
        y: number,
        fontSize: number,
        width: number,
    ): void {
        const node =
            new Node('Label');

        node.layer =
            Layers.Enum.UI_2D;

        parent.addChild(node);

        node.setPosition(
            x,
            y,
            0,
        );

        node.addComponent(
            UITransform,
        ).setContentSize(
            width,
            fontSize + 12,
        );

        const label =
            node.addComponent(Label);

        label.string = text;
        label.fontSize =
            fontSize;

        label.lineHeight =
            fontSize + 5;

        label.color =
            new Color(
                34,
                34,
                34,
                255,
            );
    }
}
