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
    HeroReviveCallbacks,
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

interface ActiveHeroRevive {
    actorId: string;
    elapsed: number;
    drainedCost: number;
    callbacks:
        HeroReviveCallbacks;
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

    private readonly activeHeroRevives =
        new Map<
            string,
            ActiveHeroRevive
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

                requestHeroRevive:
                    (
                        id,
                        callbacks,
                    ) =>
                        this.requestHeroRevive(
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
        this.activeHeroRevives.clear();
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
         * 主角/伙伴复活能量通道与雕像攻击使用同一个 CoreHealth 状态源。
         * 先处理持续扣血/持续回血，再处理本帧雕像攻击。
         */
        this.updateHeroRevives(
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
                        '[今晚守城] 防御塔雕像已损坏：后续所有英雄无法复活',
                    );

                    this.cancelAllHeroRevives();
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

    private requestHeroRevive(
        actorId: string,
        callbacks:
            HeroReviveCallbacks,
    ): boolean {
        if (
            this.gameOver ||
            this.towerHp <= 0 ||
            this.activeHeroRevives
                .has(actorId)
        ) {
            return false;
        }

        this.activeHeroRevives.set(
            actorId,
            {
                actorId,
                elapsed: 0,
                drainedCost: 0,
                callbacks,
            },
        );

        console.log(
            `[今晚守城] 防御塔开始向 ${actorId} 持续传输复活能量`,
        );

        return true;
    }

    private updateHeroRevives(
        dt: number,
    ): void {
        if (
            this.activeHeroRevives
                .size <= 0
        ) {
            return;
        }

        const revive =
            BATTLE_LAYOUT
                .heroRevive;

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
            of this.activeHeroRevives
        ) {
            if (
                this.gameOver ||
                this.towerHp <= 0
            ) {
                channel.callbacks
                    .onCancel?.();
                this.activeHeroRevives
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
                    this.activeHeroRevives
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
                this.activeHeroRevives
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

                this.activeHeroRevives
                    .delete(id);

                console.log(
                    `[今晚守城] ${channel.actorId} 复活能量传输完成，共消耗雕像 ${channel.drainedCost} HP`,
                );
            }
        }

        if (towerChanged) {
            this.refreshAll();
        }
    }

    private cancelAllHeroRevives(): void {
        for (
            const channel
            of this.activeHeroRevives
                .values()
        ) {
            channel.callbacks
                .onCancel?.();
        }

        this.activeHeroRevives.clear();
    }

    private triggerGameOver(): void {
        if (this.gameOver) {
            return;
        }

        this.gameOver = true;
        this.cancelAllHeroRevives();

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

        /**
         * v0.6.5：正式战斗不再保留覆盖上半屏的大块“防线状态”面板。
         * 旧节点可能来自 Creator 热重载，因此 Canvas / World 两边都主动清理。
         */
        for (
            const name of [
                'DefenseStatusUI',
                'CoreHpUI',
            ]
        ) {
            canvas
                .getChildByName(
                    name,
                )
                ?.destroy();
        }

        const worldRoot =
            BattleWorldService.ensure(
                canvas,
            );

        for (
            const name of [
                'DefenseObjectiveWorldUI',
                'DefenseStatusUI',
                'CoreHpUI',
            ]
        ) {
            worldRoot
                .getChildByName(
                    name,
                )
                ?.destroy();
        }

        /**
         * 防线生命改成“世界内目标条”：跟随城墙/雕像一起移动，
         * 只在玩家真正看到防线时出现，不再长期占用战斗上半屏。
         */
        const root =
            new Node(
                'DefenseObjectiveWorldUI',
            );

        root.layer =
            Layers.Enum.UI_2D;

        worldRoot.addChild(root);

        root.addComponent(
            UITransform,
        ).setContentSize(
            BATTLE_LAYOUT.map.width,
            BATTLE_LAYOUT.map.height,
        );

        this.towerBar =
            this.createWorldObjectiveBar(
                root,
                '雕像',
                BATTLE_LAYOUT
                    .defenseTower
                    .x,
                BATTLE_LAYOUT
                    .defenseTower
                    .y +
                    128,
                136,
                new Color(
                    75,
                    199,
                    220,
                    255,
                ),
            );

        this.wallBar =
            this.createWorldObjectiveBar(
                root,
                '城墙',
                BATTLE_LAYOUT
                    .wall
                    .x,
                BATTLE_LAYOUT
                    .wall
                    .y +
                    58,
                188,
                new Color(
                    212,
                    171,
                    88,
                    255,
                ),
            );

        const princess =
            new Node(
                'PrincessWorldStatus',
            );

        princess.layer =
            Layers.Enum.UI_2D;
        root.addChild(princess);

        princess.setPosition(
            BATTLE_LAYOUT.princess.x,
            BATTLE_LAYOUT.princess.y +
                72,
            0,
        );

        princess.addComponent(
            UITransform,
        ).setContentSize(
            92,
            20,
        );

        const princessBg =
            princess.addComponent(
                Graphics,
            );

        princessBg.fillColor =
            new Color(
                36,
                49,
                55,
                190,
            );
        princessBg.roundRect(
            -46,
            -10,
            92,
            20,
            10,
        );
        princessBg.fill();

        princessBg.strokeColor =
            new Color(
                236,
                210,
                148,
                225,
            );
        princessBg.lineWidth = 1.5;
        princessBg.roundRect(
            -46,
            -10,
            92,
            20,
            10,
        );
        princessBg.stroke();

        const labelNode =
            new Node(
                'PrincessLabel',
            );

        labelNode.layer =
            Layers.Enum.UI_2D;
        princess.addChild(labelNode);
        labelNode.addComponent(
            UITransform,
        ).setContentSize(
            86,
            18,
        );

        const label =
            labelNode.addComponent(
                Label,
            );

        label.fontSize = 11;
        label.lineHeight = 14;
        label.color =
            new Color(
                255,
                244,
                214,
                255,
            );

        this.princessLabel =
            label;
    }

    private createWorldObjectiveBar(
        parent: Node,
        title: string,
        x: number,
        y: number,
        width: number,
        fillColor: Color,
    ): ObjectiveBar {
        const root =
            new Node(
                `${title}WorldBar`,
            );

        root.layer =
            Layers.Enum.UI_2D;
        parent.addChild(root);
        root.setPosition(
            x,
            y,
            0,
        );

        root.addComponent(
            UITransform,
        ).setContentSize(
            width,
            20,
        );

        const bg =
            root.addComponent(
                Graphics,
            );

        bg.fillColor =
            new Color(
                35,
                45,
                48,
                205,
            );
        bg.roundRect(
            -width / 2,
            -7,
            width,
            14,
            7,
        );
        bg.fill();

        bg.strokeColor =
            new Color(
                235,
                216,
                165,
                230,
            );
        bg.lineWidth = 1.5;
        bg.roundRect(
            -width / 2,
            -7,
            width,
            14,
            7,
        );
        bg.stroke();

        const fill =
            new Node(
                'Fill',
            );

        fill.layer =
            Layers.Enum.UI_2D;
        root.addChild(fill);

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
            8,
        );

        fill.setPosition(
            -width / 2 + 3,
            0,
            0,
        );

        const fillGraphics =
            fill.addComponent(
                Graphics,
            );

        fillGraphics.fillColor =
            fillColor;
        fillGraphics.roundRect(
            0,
            -4,
            width - 6,
            8,
            4,
        );
        fillGraphics.fill();

        const labelNode =
            new Node(
                'Label',
            );

        labelNode.layer =
            Layers.Enum.UI_2D;
        root.addChild(labelNode);
        labelNode.setPosition(
            0,
            0,
            0,
        );
        labelNode.addComponent(
            UITransform,
        ).setContentSize(
            width - 8,
            18,
        );

        const label =
            labelNode.addComponent(
                Label,
            );

        label.fontSize = 10;
        label.lineHeight = 12;
        label.color =
            new Color(
                255,
                255,
                244,
                255,
            );

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
