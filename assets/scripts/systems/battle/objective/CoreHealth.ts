/**
 * @architecture TonightDefense V1.0
 * @owner battle
 * @module objective
 *
 * 文件名与 @ccclass 继续保留 CoreHealth，
 * 目的是保护 Battle.scene 已经绑定的组件 UUID。
 *
 * 实际职责已经升级为：
 * 防御塔雕像 -> 城墙 -> 公主 的防线控制器。
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
    Vec2,
} from 'cc';

import {
    BATTLE_LAYOUT,
} from '../data/BattleLayoutConfig';

import {
    CompanionReviveCallbacks,
    DefenseObjectiveKind,
    DefenseObjectiveService,
} from './DefenseObjectiveService';

import {
    EnemyController,
} from '../enemy/EnemyController';

import {
    BattleWorldService,
} from '../view/BattleWorldService';

const {
    ccclass,
    property,
} = _decorator;

interface ObjectiveBar {
    fill: Node;
    label: Label;
}

interface ActiveCompanionRevive {
    companionId: string;
    elapsed: number;
    drainedCost: number;
    callbacks:
        CompanionReviveCallbacks;
}

@ccclass('CoreHealth')
export class CoreHealth
extends Component {
    static instance:
        CoreHealth | null =
        null;

    @property
    towerMaxHp = 2000;

    @property
    wallMaxHp = 3000;

    @property
    princessMaxHp = 1;

    @property
    towerAttackRange = 300;

    @property
    towerAttackDamage = 18;

    @property
    towerAttackInterval = 0.82;

    private towerHp = 2000;
    private wallHp = 3000;
    private princessHp = 1;

    private gameOver = false;
    private towerCooldown = 0;

    private readonly activeCompanionRevives =
        new Map<
            string,
            ActiveCompanionRevive
        >();

    private towerBar:
        ObjectiveBar | null =
        null;

    private wallBar:
        ObjectiveBar | null =
        null;

    private princessLabel:
        Label | null = null;

    private damageGraphics:
        Graphics | null = null;

    /**
     * 防线坐标是静态布局，缓存 Vec2，避免怪物 AI 每帧查询时反复 new Vec2。
     */
    private readonly towerTargetPosition =
        new Vec2(
            BATTLE_LAYOUT.defenseTower.x,
            BATTLE_LAYOUT.defenseTower.y,
        );

    private readonly wallTargetPosition =
        new Vec2(
            BATTLE_LAYOUT.wall.x,
            BATTLE_LAYOUT.wall.y,
        );

    private readonly princessTargetPosition =
        new Vec2(
            BATTLE_LAYOUT.princess.x,
            BATTLE_LAYOUT.princess.y,
        );

    onLoad(): void {
        CoreHealth.instance = this;
    }

    start(): void {
        this.towerHp =
            this.towerMaxHp;

        this.wallHp =
            this.wallMaxHp;

        this.princessHp = 1;
        this.gameOver = false;

        this.createObjectiveUI();
        this.createDamageOverlay();
        this.refreshAll();

        DefenseObjectiveService.configure(
            {
                getActiveObjective:
                    () =>
                        this.getActiveObjective(),

                getObjectivePosition:
                    (kind) =>
                        this.getObjectivePosition(
                            kind,
                        ),

                takeDamage:
                    (kind, amount) =>
                        this.takeDamageToObjective(
                            kind,
                            amount,
                        ),

                isGameOver:
                    () =>
                        this.gameOver,

                requestCompanionRevive:
                    (
                        id,
                        callbacks,
                    ) =>
                        this.requestCompanionRevive(
                            id,
                            callbacks,
                        ),
            },
        );

        console.log(
            `[今晚守城] 雕像 ${this.towerHp} HP / 城墙 ${this.wallHp} HP / 公主 1 HP`,
        );
    }

    onDestroy(): void {
        this.activeCompanionRevives.clear();
        DefenseObjectiveService.clear();

        if (
            CoreHealth.instance ===
            this
        ) {
            CoreHealth.instance = null;
        }
    }

    update(
        dt: number,
    ): void {
        if (this.gameOver) {
            return;
        }

        /**
         * 复活能量通道与雕像攻击使用同一个 CoreHealth 状态源。
         * 先处理持续扣血/持续回血，再处理本帧雕像攻击。
         */
        this.updateCompanionRevives(
            dt,
        );

        if (this.towerHp <= 0) {
            return;
        }

        this.towerCooldown -= dt;

        if (
            this.towerCooldown > 0
        ) {
            return;
        }

        const enemy =
            EnemyController.instance
                ?.findNearestEnemy(
                    BATTLE_LAYOUT
                        .defenseTower,
                    this.towerAttackRange,
                );

        if (!enemy) {
            return;
        }

        const targetX =
            enemy.node.position.x;

        const targetY =
            enemy.node.position.y;

        EnemyController.instance
            ?.takeDamageToEnemy(
                enemy.node,
                this.towerAttackDamage,
            );

        this.showTowerAttack(
            targetX,
            targetY,
        );

        this.towerCooldown =
            this.towerAttackInterval;
    }

    /**
     * 兼容旧代码。
     * 现在 currentHp 代表雕像 HP。
     */
    get currentHp(): number {
        return this.towerHp;
    }

    /**
     * 兼容旧代码。
     * 现在 isDead 代表整局失败。
     */
    get isDead(): boolean {
        return this.gameOver;
    }

    getActiveObjective():
        DefenseObjectiveKind | null {
        if (this.gameOver) {
            return null;
        }

        if (this.towerHp > 0) {
            return 'tower';
        }

        if (this.wallHp > 0) {
            return 'wall';
        }

        if (this.princessHp > 0) {
            return 'princess';
        }

        return null;
    }

    getObjectivePosition(
        kind:
            DefenseObjectiveKind,
    ): Vec2 {
        switch (kind) {
            case 'tower':
                return this.towerTargetPosition;

            case 'wall':
                return this.wallTargetPosition;

            case 'princess':
            default:
                return this.princessTargetPosition;
        }
    }

    /**
     * 兼容旧接口：
     * 伤害当前正在被进攻的防线目标。
     */
    takeDamage(
        amount: number,
    ): void {
        const objective =
            this.getActiveObjective();

        if (objective) {
            this.takeDamageToObjective(
                objective,
                amount,
            );
        }
    }

    takeDamageToObjective(
        kind:
            DefenseObjectiveKind,
        amount: number,
    ): void {
        if (this.gameOver) {
            return;
        }

        const active =
            this.getActiveObjective();

        /**
         * 强制顺序：
         * 雕像 -> 城墙 -> 公主
         */
        if (active !== kind) {
            return;
        }

        const damage =
            Math.max(
                0,
                Math.round(amount),
            );

        if (damage <= 0) {
            return;
        }

        switch (kind) {
            case 'tower':
                this.towerHp =
                    Math.max(
                        0,
                        this.towerHp -
                            damage,
                    );

                if (
                    this.towerHp <= 0
                ) {
                    console.log(
                        '[今晚守城] 防御塔雕像已损坏：后续伙伴无法复活',
                    );

                    this.cancelAllCompanionRevives();
                }
                break;

            case 'wall':
                this.wallHp =
                    Math.max(
                        0,
                        this.wallHp -
                            damage,
                    );

                if (
                    this.wallHp <= 0
                ) {
                    console.log(
                        '[今晚守城] 城墙已被攻破',
                    );
                }
                break;

            case 'princess':
                this.princessHp = 0;
                this.triggerGameOver();
                break;
        }

        this.refreshAll();
    }

    private requestCompanionRevive(
        companionId: string,
        callbacks:
            CompanionReviveCallbacks,
    ): boolean {
        if (
            this.gameOver ||
            this.towerHp <= 0 ||
            this.activeCompanionRevives
                .has(companionId)
        ) {
            return false;
        }

        this.activeCompanionRevives.set(
            companionId,
            {
                companionId,
                elapsed: 0,
                drainedCost: 0,
                callbacks,
            },
        );

        console.log(
            `[今晚守城] 防御塔开始向 ${companionId} 持续传输复活能量`,
        );

        return true;
    }

    private updateCompanionRevives(
        dt: number,
    ): void {
        if (
            this.activeCompanionRevives
                .size <= 0
        ) {
            return;
        }

        const revive =
            BATTLE_LAYOUT
                .companionRevive;

        const safeDt =
            Math.max(
                0,
                Math.min(
                    dt,
                    1 / 20,
                ),
            );

        let towerChanged = false;

        for (
            const [id, channel]
            of this.activeCompanionRevives
        ) {
            if (
                this.gameOver ||
                this.towerHp <= 0
            ) {
                channel.callbacks
                    .onCancel?.();
                this.activeCompanionRevives
                    .delete(id);
                continue;
            }

            channel.elapsed =
                Math.min(
                    revive.duration,
                    channel.elapsed +
                        safeDt,
                );

            const progress =
                revive.duration <= 0
                    ? 1
                    : Math.max(
                        0,
                        Math.min(
                            1,
                            channel.elapsed /
                                revive.duration,
                        ),
                    );

            /**
             * 使用累计目标消耗量，而不是每帧 round，避免 60FPS 下单帧扣血为 0
             * 或不同帧率导致总消耗不一致。
             */
            const targetCost =
                Math.min(
                    revive.totalTowerHpCost,
                    Math.floor(
                        revive.totalTowerHpCost *
                        progress,
                    ),
                );

            const dueCost =
                targetCost -
                channel.drainedCost;

            if (dueCost > 0) {
                const available =
                    Math.max(
                        0,
                        Math.floor(
                            this.towerHp,
                        ),
                    );

                if (
                    available <
                    dueCost
                ) {
                    /**
                     * 能量不足时把雕像剩余生命全部输送出去，然后中断复活。
                     * 雕像允许因此归零，随后怪物目标自然推进到城墙。
                     */
                    this.towerHp = 0;
                    channel.drainedCost +=
                        available;
                    towerChanged = true;

                    channel.callbacks
                        .onCancel?.();
                    this.activeCompanionRevives
                        .delete(id);

                    console.log(
                        '[今晚守城] 防御塔生命在复活传输中耗尽，剩余复活全部中断',
                    );
                    continue;
                }

                this.towerHp -=
                    dueCost;

                channel.drainedCost +=
                    dueCost;

                towerChanged = true;
            }

            if (
                this.towerHp <= 0 &&
                progress < 1
            ) {
                channel.callbacks
                    .onCancel?.();
                this.activeCompanionRevives
                    .delete(id);

                console.log(
                    '[今晚守城] 防御塔生命在复活传输中耗尽，复活中断',
                );
                continue;
            }

            channel.callbacks
                .onProgress(
                    progress,
                );

            if (progress >= 1) {
                channel.callbacks
                    .onComplete();

                this.activeCompanionRevives
                    .delete(id);

                console.log(
                    `[今晚守城] ${channel.companionId} 复活能量传输完成，共消耗雕像 ${channel.drainedCost} HP`,
                );
            }
        }

        if (towerChanged) {
            this.refreshAll();
        }
    }

    private cancelAllCompanionRevives(): void {
        for (
            const channel
            of this.activeCompanionRevives
                .values()
        ) {
            channel.callbacks
                .onCancel?.();
        }

        this.activeCompanionRevives.clear();
    }

    private triggerGameOver(): void {
        if (this.gameOver) {
            return;
        }

        this.gameOver = true;
        this.cancelAllCompanionRevives();

        console.log(
            '[今晚守城] 公主受到攻击：守城失败',
        );

        this.createGameOverOverlay();
    }

    private createObjectiveUI(): void {
        const canvas =
            this.node.parent;

        if (!canvas) {
            return;
        }

        const old =
            canvas.getChildByName(
                'DefenseStatusUI',
            );

        if (old) {
            old.destroy();
        }

        /**
         * 兼容旧 CoreHpUI，避免旧血条残留。
         */
        const oldCore =
            canvas.getChildByName(
                'CoreHpUI',
            );

        if (oldCore) {
            oldCore.destroy();
        }

        const root =
            new Node(
                'DefenseStatusUI',
            );

        root.layer =
            Layers.Enum.UI_2D;

        canvas.addChild(root);

        root.setPosition(
            0,
            448,
            0,
        );

        root.addComponent(
            UITransform,
        ).setContentSize(
            642,
            96,
        );

        const shadow =
            new Node(
                'DefenseStatusShadow',
            );

        shadow.layer =
            Layers.Enum.UI_2D;
        root.addChild(shadow);
        shadow.setPosition(
            0,
            -4,
            0,
        );

        const shadowGraphics =
            shadow.addComponent(
                Graphics,
            );

        shadowGraphics.fillColor =
            new Color(
                46,
                60,
                53,
                60,
            );

        shadowGraphics.roundRect(
            -321,
            -48,
            642,
            96,
            24,
        );
        shadowGraphics.fill();

        const panel =
            new Node(
                'DefenseStatusPanel',
            );

        panel.layer =
            Layers.Enum.UI_2D;
        root.addChild(panel);

        const panelGraphics =
            panel.addComponent(
                Graphics,
            );

        panelGraphics.fillColor =
            new Color(
                248,
                242,
                216,
                248,
            );

        panelGraphics.roundRect(
            -321,
            -48,
            642,
            96,
            24,
        );
        panelGraphics.fill();

        panelGraphics.fillColor =
            new Color(
                255,
                251,
                238,
                105,
            );

        panelGraphics.roundRect(
            -306,
            9,
            610,
            22,
            11,
        );
        panelGraphics.fill();

        panelGraphics.strokeColor =
            new Color(
                221,
                203,
                158,
                255,
            );
        panelGraphics.lineWidth = 2.5;

        panelGraphics.roundRect(
            -321,
            -48,
            642,
            96,
            24,
        );
        panelGraphics.stroke();

        const titleNode =
            new Node(
                'DefenseStatusTitle',
            );

        titleNode.layer =
            Layers.Enum.UI_2D;
        root.addChild(titleNode);
        titleNode.setPosition(
            -258,
            29,
            0,
        );
        titleNode.addComponent(
            UITransform,
        ).setContentSize(
            96,
            20,
        );

        const titleLabel =
            titleNode.addComponent(
                Label,
            );

        titleLabel.string =
            '防线状态';
        titleLabel.fontSize = 14;
        titleLabel.lineHeight = 18;
        titleLabel.color =
            new Color(
                111,
                96,
                67,
                255,
            );

        this.towerBar =
            this.createBar(
                root,
                '雕像',
                10,
                250,
            );

        this.wallBar =
            this.createBar(
                root,
                '城墙',
                -18,
                250,
            );

        const princess =
            new Node(
                'PrincessStatus',
            );

        princess.layer =
            Layers.Enum.UI_2D;
        root.addChild(princess);

        princess.setPosition(
            230,
            -4,
            0,
        );

        princess.addComponent(
            UITransform,
        ).setContentSize(
            152,
            58,
        );

        const princessGraphics =
            princess.addComponent(
                Graphics,
            );

        princessGraphics.fillColor =
            new Color(
                245,
                229,
                192,
                255,
            );

        princessGraphics.roundRect(
            -76,
            -29,
            152,
            58,
            20,
        );
        princessGraphics.fill();

        princessGraphics.fillColor =
            new Color(
                255,
                247,
                230,
                115,
            );

        princessGraphics.roundRect(
            -62,
            7,
            124,
            8,
            4,
        );
        princessGraphics.fill();

        princessGraphics.strokeColor =
            new Color(
                222,
                198,
                154,
                255,
            );
        princessGraphics.lineWidth = 2;

        princessGraphics.roundRect(
            -76,
            -29,
            152,
            58,
            20,
        );
        princessGraphics.stroke();

        const princessTitle =
            new Node(
                'PrincessCaption',
            );

        princessTitle.layer =
            Layers.Enum.UI_2D;
        princess.addChild(princessTitle);
        princessTitle.setPosition(
            0,
            11,
            0,
        );
        princessTitle.addComponent(
            UITransform,
        ).setContentSize(
            96,
            16,
        );

        const princessCaption =
            princessTitle.addComponent(
                Label,
            );

        princessCaption.string =
            '最终守护';
        princessCaption.fontSize = 12;
        princessCaption.lineHeight = 14;
        princessCaption.color =
            new Color(
                136,
                101,
                96,
                255,
            );

        const labelNode =
            new Node(
                'PrincessLabel',
            );

        labelNode.layer =
            Layers.Enum.UI_2D;
        princess.addChild(labelNode);
        labelNode.setPosition(
            0,
            -10,
            0,
        );
        labelNode.addComponent(
            UITransform,
        ).setContentSize(
            120,
            24,
        );

        const label =
            labelNode.addComponent(
                Label,
            );

        label.fontSize = 18;
        label.lineHeight = 22;
        label.color =
            new Color(
                109,
                71,
                78,
                255,
            );

        this.princessLabel =
            label;
    }

    private createBar(
        parent: Node,
        title: string,
        y: number,
        width: number,
    ): ObjectiveBar {
        const root =
            new Node(
                `${title}Bar`,
            );

        root.layer =
            Layers.Enum.UI_2D;

        parent.addChild(root);

        root.setPosition(
            -60,
            y,
            0,
        );

        root.addComponent(
            UITransform,
        ).setContentSize(
            430,
            26,
        );

        const badge =
            new Node(
                'Badge',
            );

        badge.layer =
            Layers.Enum.UI_2D;
        root.addChild(badge);
        badge.setPosition(
            -144,
            0,
            0,
        );
        badge.addComponent(
            UITransform,
        ).setContentSize(
            108,
            26,
        );

        const badgeGraphics =
            badge.addComponent(
                Graphics,
            );

        badgeGraphics.fillColor =
            title === '雕像'
                ? new Color(
                    224,
                    240,
                    244,
                    255,
                )
                : new Color(
                    238,
                    228,
                    208,
                    255,
                );

        badgeGraphics.roundRect(
            -54,
            -13,
            108,
            26,
            13,
        );
        badgeGraphics.fill();

        badgeGraphics.strokeColor =
            title === '雕像'
                ? new Color(
                    141,
                    193,
                    204,
                    255,
                )
                : new Color(
                    201,
                    166,
                    109,
                    255,
                );

        badgeGraphics.lineWidth = 2;
        badgeGraphics.roundRect(
            -54,
            -13,
            108,
            26,
            13,
        );
        badgeGraphics.stroke();

        const labelNode =
            new Node(
                'Label',
            );

        labelNode.layer =
            Layers.Enum.UI_2D;
        badge.addChild(labelNode);
        labelNode.addComponent(
            UITransform,
        ).setContentSize(
            96,
            20,
        );

        const label =
            labelNode.addComponent(
                Label,
            );

        label.fontSize = 15;
        label.lineHeight = 18;
        label.color =
            new Color(
                66,
                68,
                65,
                255,
            );

        const bg =
            new Node(
                'Bg',
            );

        bg.layer =
            Layers.Enum.UI_2D;
        root.addChild(bg);
        bg.setPosition(
            78,
            0,
            0,
        );
        bg.addComponent(
            UITransform,
        ).setContentSize(
            width,
            16,
        );

        const bgGraphics =
            bg.addComponent(
                Graphics,
            );

        bgGraphics.fillColor =
            new Color(
                64,
                69,
                73,
                240,
            );

        bgGraphics.roundRect(
            -width / 2,
            -7,
            width,
            14,
            7,
        );
        bgGraphics.fill();

        bgGraphics.fillColor =
            new Color(
                94,
                99,
                103,
                135,
            );

        bgGraphics.roundRect(
            -width / 2 + 6,
            1,
            width - 12,
            3,
            2,
        );
        bgGraphics.fill();

        bgGraphics.strokeColor =
            new Color(
                46,
                52,
                58,
                255,
            );
        bgGraphics.lineWidth = 2;
        bgGraphics.roundRect(
            -width / 2,
            -7,
            width,
            14,
            7,
        );
        bgGraphics.stroke();

        const fill =
            new Node(
                'Fill',
            );

        fill.layer =
            Layers.Enum.UI_2D;
        bg.addChild(fill);

        const transform =
            fill.addComponent(
                UITransform,
            );

        transform.setAnchorPoint(
            0,
            0.5,
        );

        transform.setContentSize(
            width - 6,
            10,
        );

        fill.setPosition(
            -width / 2 + 3,
            0,
            0,
        );

        const fg =
            fill.addComponent(
                Graphics,
            );

        fg.fillColor =
            title === '雕像'
                ? new Color(
                    87,
                    188,
                    205,
                    255,
                )
                : new Color(
                    190,
                    148,
                    91,
                    255,
                );

        fg.roundRect(
            0,
            -5,
            width - 6,
            10,
            5,
        );
        fg.fill();

        fg.fillColor =
            title === '雕像'
                ? new Color(
                    174,
                    234,
                    245,
                    155,
                )
                : new Color(
                    233,
                    204,
                    156,
                    145,
                );

        fg.roundRect(
            8,
            1,
            width - 24,
            3,
            2,
        );
        fg.fill();

        return {
            fill,
            label,
        };
    }
    private createDamageOverlay(): void {
        const canvas =
            this.node.parent;

        if (!canvas) {
            return;
        }

        const worldRoot =
            BattleWorldService.ensure(
                canvas,
            );

        const old =
            worldRoot.getChildByName(
                'DefenseDamageOverlay',
            );

        if (old) {
            old.destroy();
        }

        const legacyOld =
            canvas.getChildByName(
                'DefenseDamageOverlay',
            );

        if (legacyOld) {
            legacyOld.destroy();
        }

        const node =
            new Node(
                'DefenseDamageOverlay',
            );

        node.layer =
            Layers.Enum.UI_2D;

        worldRoot.addChild(node);

        this.damageGraphics =
            node.addComponent(
                Graphics,
            );
    }

    private refreshAll(): void {
        this.refreshBar(
            this.towerBar,
            '雕像',
            this.towerHp,
            this.towerMaxHp,
        );

        this.refreshBar(
            this.wallBar,
            '城墙',
            this.wallHp,
            this.wallMaxHp,
        );

        if (this.princessLabel) {
            this.princessLabel.string =
                this.princessHp > 0
                    ? '公主 ♥ 1'
                    : '公主 ♥ 0';
        }

        this.drawDamageState();
    }

    private refreshBar(
        bar:
            ObjectiveBar | null,
        title: string,
        current: number,
        max: number,
    ): void {
        if (!bar) {
            return;
        }

        const ratio =
            max <= 0
                ? 0
                : Math.max(
                    0,
                    Math.min(
                        1,
                        current / max,
                    ),
                );

        bar.fill.setScale(
            ratio,
            1,
            1,
        );

        bar.label.string =
            `${title} ${current}/${max}`;
    }

    /**
     * 程序绘制的原型破损程度：
     * 75% / 50% / 25% / 0%。
     */
    private drawDamageState(): void {
        const g =
            this.damageGraphics;

        if (!g) {
            return;
        }

        g.clear();

        this.drawCracks(
            g,
            BATTLE_LAYOUT
                .defenseTower
                .x,
            BATTLE_LAYOUT
                .defenseTower
                .y +
                18,
            this.towerHp /
                this.towerMaxHp,
            52,
        );

        this.drawCracks(
            g,
            BATTLE_LAYOUT
                .wall
                .x,
            BATTLE_LAYOUT
                .wall
                .y,
            this.wallHp /
                this.wallMaxHp,
            120,
        );
    }

    private drawCracks(
        g: Graphics,
        x: number,
        y: number,
        ratio: number,
        spread: number,
    ): void {
        let level = 0;

        if (ratio <= 0) {
            level = 4;
        } else if (
            ratio <= 0.25
        ) {
            level = 3;
        } else if (
            ratio <= 0.5
        ) {
            level = 2;
        } else if (
            ratio <= 0.75
        ) {
            level = 1;
        }

        if (level <= 0) {
            return;
        }

        g.strokeColor =
            new Color(
                72,
                67,
                66,
                220,
            );

        g.lineWidth = 2.5;

        for (
            let i = 0;
            i < level * 2;
            i += 1
        ) {
            const offset =
                (
                    i -
                    level
                ) *
                (
                    spread /
                    (
                        level *
                        2 +
                        1
                    )
                );

            g.moveTo(
                x + offset,
                y + 18 -
                    i * 5,
            );

            g.lineTo(
                x +
                    offset +
                    (
                        i % 2 === 0
                            ? 12
                            : -12
                    ),
                y + 3 -
                    i * 4,
            );

            g.lineTo(
                x +
                    offset +
                    (
                        i % 2 === 0
                            ? 5
                            : -5
                    ),
                y - 14 -
                    i * 2,
            );
        }

        g.stroke();

        if (level === 4) {
            g.fillColor =
                new Color(
                    78,
                    73,
                    72,
                    190,
                );

            for (
                let i = -3;
                i <= 3;
                i += 1
            ) {
                g.circle(
                    x + i * 13,
                    y -
                        28 +
                        Math.abs(i) * 2,
                    7 +
                        (
                            Math.abs(i) %
                            2
                        ) *
                        3,
                );

                g.fill();
            }
        }
    }

    private showTowerAttack(
        targetX: number,
        targetY: number,
    ): void {
        const canvas =
            this.node.parent;

        if (!canvas) {
            return;
        }

        const beam =
            new Node(
                'TowerAttackBeam',
            );

        beam.layer =
            Layers.Enum.UI_2D;

        BattleWorldService.ensure(
            canvas,
        ).addChild(beam);

        const g =
            beam.addComponent(
                Graphics,
            );

        g.strokeColor =
            new Color(
                103,
                219,
                237,
                220,
            );

        g.lineWidth = 3;

        g.moveTo(
            BATTLE_LAYOUT
                .defenseTower
                .x,
            BATTLE_LAYOUT
                .defenseTower
                .y +
                55,
        );

        g.lineTo(
            targetX,
            targetY,
        );

        g.stroke();

        this.scheduleOnce(
            () => {
                if (beam.isValid) {
                    beam.destroy();
                }
            },
            0.07,
        );
    }

    private createGameOverOverlay(): void {
        const canvas =
            this.node.parent;

        if (!canvas) {
            return;
        }

        const old =
            canvas.getChildByName(
                'GameOverOverlay',
            );

        if (old) {
            return;
        }

        const root =
            new Node(
                'GameOverOverlay',
            );

        root.layer =
            Layers.Enum.UI_2D;

        canvas.addChild(root);

        root.addComponent(
            UITransform,
        ).setContentSize(
            720,
            1280,
        );

        const bg =
            root.addComponent(
                Graphics,
            );

        bg.fillColor =
            new Color(
                25,
                24,
                28,
                145,
            );

        bg.rect(
            -360,
            -640,
            720,
            1280,
        );

        bg.fill();

        const text =
            new Node(
                'GameOverText',
            );

        text.layer =
            Layers.Enum.UI_2D;

        root.addChild(text);

        text.addComponent(
            UITransform,
        ).setContentSize(
            420,
            90,
        );

        const label =
            text.addComponent(
                Label,
            );

        label.string =
            '守城失败';

        label.fontSize = 54;
        label.lineHeight = 64;

        label.color =
            new Color(
                244,
                226,
                210,
                255,
            );
    }
}
