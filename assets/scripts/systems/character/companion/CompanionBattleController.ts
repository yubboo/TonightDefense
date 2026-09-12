/**
 * @architecture TonightDefense V1.0
 * @owner character
 * @module companion
 *
 * 兼容类名保留 CompanionBattleController，保护现有场景与调用点。
 * 实际职责是“AI 控制的英雄运行时”。
 * 人物与职业数据统一来自 CharacterCatalog / ProfessionCatalog；
 * 玩家主角与 AI 伙伴的区别只在控制方式。
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
    CharacterDefinition,
} from '../data/CharacterCatalog';

import {
    EnemyController,
    EnemySearchBounds,
    EnemyTarget,
} from '../../battle/enemy/EnemyController';

import {
    BATTLE_LAYOUT,
} from '../../battle/data/BattleLayoutConfig';

import {
    BattleWorldService,
} from '../../battle/view/BattleWorldService';

import {
    CutoutCharacterAnimator,
} from '../animation/CutoutCharacterAnimator';

import {
    CharacterCombatant,
} from '../stats/CharacterCombatant';

import {
    BattleTargetRegistry,
} from '../../battle/targeting/BattleTargetRegistry';

import {
    DefenseObjectiveService,
} from '../../battle/objective/DefenseObjectiveService';

import {
    getProfessionById,
} from '../../profession/definition/ProfessionCatalog';

import {
    ProfessionAttackMode,
    ProfessionDefinition,
} from '../../profession/definition/ProfessionTypes';

const { ccclass } = _decorator;

interface CompanionRuntime {
    definition: CharacterDefinition;
    profession: ProfessionDefinition;
    engageBounds: EnemySearchBounds;
    node: Node;
    slotIndex: number;
    cooldown: number;
    patrolTarget: Vec2 | null;
    patrolPauseRemaining: number;
    motionAnimator:
        CutoutCharacterAnimator | null;
    combatant: CharacterCombatant;

    /** 伙伴复活通道状态；复活中不参与 AI 和怪物目标选择。 */
    reviving: boolean;
    reviveProgress: number;
    reviveVisualTime: number;
    reviveVisual:
        Node | null;
}

export interface CompanionHudSnapshot {
    definition: CharacterDefinition;
    currentHp: number;
    maxHp: number;
    isAlive: boolean;
    isReviving: boolean;
}

interface ProjectileRuntime {
    node: Node;
    target: Node;
    damage: number;
    speed: number;
    mode: ProfessionAttackMode;
}

/**
 * AI 英雄战斗控制器 V1.1
 *
 * - 四名 AI 英雄使用“三人横排 + 一人远程后排”的出生/复活阵位。
 * - Character / Profession 与玩家主角完全共用同一套定义。
 * - AI 只在主战场 + 防守区寻找、追击和攻击怪物，不再进入泉水区。
 * - 无可交战目标时返回各自阵位附近巡逻，保持守城阵型。
 * - 阵亡后向防御塔雕像申请持续能量复活。
 */
@ccclass('CompanionBattleController')
export class CompanionBattleController
extends Component {
    static instance:
        CompanionBattleController | null =
        null;

    private readonly companions:
        CompanionRuntime[] = [];

    private readonly projectiles:
        ProjectileRuntime[] = [];

    onLoad(): void {
        CompanionBattleController.instance =
            this;
    }

    onDestroy(): void {
        if (
            CompanionBattleController.instance ===
            this
        ) {
            CompanionBattleController.instance =
                null;
        }

        for (
            const companion
            of this.companions
        ) {
            BattleTargetRegistry.unregister(
                this.getRegistryId(
                    companion.definition.id,
                ),
            );

            this.destroyReviveVisual(
                companion,
            );
        }

        for (
            const projectile
            of this.projectiles
        ) {
            if (projectile.node.isValid) {
                projectile.node.destroy();
            }
        }

        this.projectiles.length = 0;
        this.companions.length = 0;
    }

    update(
        dt: number,
    ): void {
        for (
            const companion
            of this.companions
        ) {
            if (companion.reviving) {
                this.updateReviveVisual(
                    companion,
                    dt,
                );
                continue;
            }

            if (
                !companion
                    .combatant
                    .isAlive
            ) {
                continue;
            }

            companion.cooldown -= dt;

            if (
                companion
                    .patrolPauseRemaining >
                0
            ) {
                companion
                    .patrolPauseRemaining -=
                    dt;
            }

            this.updateCompanion(
                companion,
                dt,
            );
        }

        this.updateProjectiles(dt);
    }

    /**
     * 正式战斗人物卡的只读数据入口。
     * HUD 不持有第二份队伍或生命状态，只读取当前已部署角色。
     */
    getHudRoster():
        CompanionHudSnapshot[] {
        return this.companions.map(
            (companion) => ({
                definition:
                    companion.definition,
                currentHp:
                    companion
                        .combatant
                        .currentHp,
                maxHp:
                    companion
                        .combatant
                        .maxHp,
                isAlive:
                    companion
                        .combatant
                        .isAlive,
                isReviving:
                    companion.reviving,
            }),
        );
    }

    spawnCompanion(
        definition:
            CharacterDefinition,
    ): boolean {
        if (
            this.companions.length >=
            4
        ) {
            console.warn(
                '[今晚守城] AI伙伴已达到4人上限',
            );
            return false;
        }

        if (
            this.companions.some(
                (item) =>
                    item
                        .definition
                        .id ===
                    definition.id,
            )
        ) {
            return false;
        }

        const canvas =
            this.node.parent;

        if (!canvas) {
            return false;
        }

        const slotIndex =
            this.companions.length;

        const spawn =
            BATTLE_LAYOUT
                .companionAnchors[
                    slotIndex
                ];

        const node =
            new Node(
                `Companion_${definition.id}`,
            );

        node.layer =
            Layers.Enum.UI_2D;

        BattleWorldService.ensure(canvas).addChild(node);

        node.addComponent(
            UITransform,
        ).setContentSize(
            90,
            110,
        );

        node.setPosition(
            spawn.x,
            spawn.y,
            0,
        );

        const profession =
            getProfessionById(
                definition.professionId,
            );

        const motionAnimator =
            this.createCompanionVisual(
                node,
                definition,
                profession.attackMode,
            );

        const combatant =
            node.addComponent(
                CharacterCombatant,
            );

        const runtime:
            CompanionRuntime = {
                definition,
                profession,
                engageBounds:
                    this.createEngageBounds(
                        profession.attackRange,
                    ),
                node,
                slotIndex,

                cooldown:
                    0.2 +
                    slotIndex * 0.08,

                patrolTarget: null,

                patrolPauseRemaining:
                    this.randomRange(
                        0.2,
                        0.9,
                    ),

                motionAnimator,
                combatant,

                reviving: false,
                reviveProgress: 0,
                reviveVisualTime: 0,
                reviveVisual: null,
            };

        const baseStats =
            profession.baseStats;

        combatant.setup(
            {
                maxHp:
                    baseStats.maxHp,

                attackPower:
                    baseStats.attackPower,

                defense:
                    baseStats.defense,

                moveSpeed:
                    baseStats.moveSpeed,

                hpBarY:
                    definition.id ===
                        'mage'
                        ? 58
                        : 66,

                hpBarWidth: 56,
            },
            () => {
                this.onCompanionDeath(
                    runtime,
                );
            },
        );

        this.companions.push(
            runtime,
        );

        BattleTargetRegistry.register(
            {
                id:
                    this.getRegistryId(
                        definition.id,
                    ),

                kind:
                    'hero',

                controlMode:
                    'ai',

                node,

                isAlive:
                    () =>
                        combatant.isAlive &&
                        !runtime.reviving,

                takeDamage:
                    (amount) => {
                        if (runtime.reviving) {
                            return 0;
                        }

                        const actual =
                            combatant
                                .takeDamage(
                                    amount,
                                );

                        if (
                            actual > 0 &&
                            combatant.isAlive
                        ) {
                            runtime
                                .motionAnimator
                                ?.playHurt();
                        }

                        return actual;
                    },
            },
        );

        console.log(
            `[今晚守城] ${definition.name} 已部署 HP=${baseStats.maxHp} 防御=${baseStats.defense}`,
        );

        return true;
    }

    getAliveCount(): number {
        let count = 0;

        for (
            const companion
            of this.companions
        ) {
            if (
                companion
                    .combatant
                    .isAlive &&
                !companion.reviving
            ) {
                count += 1;
            }
        }

        return count;
    }


    /**
     * SkillSystem 使用的公开查询接口。
     * 不暴露 CompanionRuntime 内部结构。
     */
    getCombatantByCatalogId(
        companionId: string,
    ): CharacterCombatant | null {
        const runtime =
            this.companions.find(
                (companion) =>
                    companion
                        .definition
                        .id ===
                    companionId,
            );

        return (
            runtime
                ?.combatant ??
            null
        );
    }

    private onCompanionDeath(
        companion:
            CompanionRuntime,
    ): void {
        companion
            .motionAnimator
            ?.setMoving(false);

        console.log(
            `[今晚守城] ${companion.definition.name} 阵亡，等待防御塔持续传输复活能量`,
        );

        const accepted =
            DefenseObjectiveService
                .requestCompanionRevive(
                    companion
                        .definition
                        .id,
                    {
                        onProgress:
                            (progress) => {
                                this.applyReviveProgress(
                                    companion,
                                    progress,
                                );
                            },

                        onComplete:
                            () => {
                                this.completeCompanionRevive(
                                    companion,
                                );
                            },

                        onCancel:
                            () => {
                                this.cancelCompanionRevive(
                                    companion,
                                );
                            },
                    },
                );

        if (!accepted) {
            console.log(
                `[今晚守城] ${companion.definition.name} 无法开始复活：雕像已损坏或没有可用生命`,
            );
            return;
        }

        this.beginCompanionRevive(
            companion,
        );
    }

    private beginCompanionRevive(
        companion:
            CompanionRuntime,
    ): void {
        const reviveAnchor =
            BATTLE_LAYOUT
                .companionReviveAnchors[
                    companion.slotIndex
                ];

        companion.reviving = true;
        companion.reviveProgress = 0;
        companion.reviveVisualTime = 0;
        companion.patrolTarget = null;
        companion.patrolPauseRemaining = 0;

        companion.node.setPosition(
            reviveAnchor.x,
            reviveAnchor.y,
            0,
        );

        companion.combatant
            .beginRevive(
                BATTLE_LAYOUT
                    .companionRevive
                    .initialHpRatio,
            );

        companion
            .motionAnimator
            ?.setMoving(false);

        this.createReviveVisual(
            companion,
        );
    }

    private applyReviveProgress(
        companion:
            CompanionRuntime,
        progress: number,
    ): void {
        if (
            !companion.reviving ||
            !companion.node.isValid
        ) {
            return;
        }

        const safeProgress =
            Math.max(
                0,
                Math.min(
                    1,
                    progress,
                ),
            );

        companion.reviveProgress =
            safeProgress;

        const initialRatio =
            BATTLE_LAYOUT
                .companionRevive
                .initialHpRatio;

        const hpRatio =
            initialRatio +
            (
                1 -
                initialRatio
            ) *
            safeProgress;

        companion.combatant
            .setReviveProgress(
                hpRatio,
            );
    }

    private completeCompanionRevive(
        companion:
            CompanionRuntime,
    ): void {
        if (!companion.node.isValid) {
            return;
        }

        companion.combatant
            .setReviveProgress(1);

        companion.reviving = false;
        companion.reviveProgress = 1;
        companion.patrolTarget = null;
        companion.patrolPauseRemaining = 0.7;

        this.destroyReviveVisual(
            companion,
        );

        console.log(
            `[今晚守城] ${companion.definition.name} 已完成能量传输并满血复活`,
        );
    }

    private cancelCompanionRevive(
        companion:
            CompanionRuntime,
    ): void {
        if (!companion.node.isValid) {
            return;
        }

        companion.reviving = false;
        companion.reviveProgress = 0;
        companion.combatant
            .cancelRevive();

        this.destroyReviveVisual(
            companion,
        );

        console.log(
            `[今晚守城] ${companion.definition.name} 复活传输中断`,
        );
    }

    private createReviveVisual(
        companion:
            CompanionRuntime,
    ): void {
        this.destroyReviveVisual(
            companion,
        );

        const canvas =
            this.node.parent;

        if (!canvas) {
            return;
        }

        const visual =
            new Node(
                `ReviveEnergy_${companion.slotIndex + 1}`,
            );

        visual.layer =
            Layers.Enum.UI_2D;

        BattleWorldService
            .ensure(canvas)
            .addChild(visual);

        visual.addComponent(
            Graphics,
        );

        companion.reviveVisual =
            visual;
    }

    private updateReviveVisual(
        companion:
            CompanionRuntime,
        dt: number,
    ): void {
        const visual =
            companion.reviveVisual;

        if (
            !visual ||
            !visual.isValid
        ) {
            return;
        }

        const g =
            visual.getComponent(
                Graphics,
            );

        if (!g) {
            return;
        }

        companion.reviveVisualTime +=
            Math.max(
                0,
                Math.min(
                    dt,
                    1 / 20,
                ),
            );

        g.clear();

        const tower =
            BATTLE_LAYOUT
                .defenseTower;

        const anchor =
            BATTLE_LAYOUT
                .companionReviveAnchors[
                    companion.slotIndex
                ];

        /** 基础能量束。 */
        g.strokeColor =
            new Color(
                91,
                213,
                235,
                105,
            );
        g.lineWidth = 4;
        g.moveTo(
            tower.x,
            tower.y + 46,
        );
        g.lineTo(
            anchor.x,
            anchor.y + 22,
        );
        g.stroke();

        /** 复活位能量环。 */
        g.strokeColor =
            new Color(
                168,
                240,
                249,
                210,
            );
        g.lineWidth = 3;
        g.circle(
            anchor.x,
            anchor.y,
            34 +
                Math.sin(
                    companion.reviveVisualTime *
                    5,
                ) *
                3,
        );
        g.stroke();

        /**
         * 4 个光点沿雕像 -> 伙伴方向持续移动，表现“能量正在传输”。
         */
        const startX =
            tower.x;
        const startY =
            tower.y + 46;
        const endX =
            anchor.x;
        const endY =
            anchor.y + 22;

        g.fillColor =
            new Color(
                182,
                245,
                255,
                235,
            );

        const phase =
            (
                companion.reviveVisualTime *
                0.85
            ) %
            1;

        for (
            let i = 0;
            i < 4;
            i += 1
        ) {
            const t =
                (
                    phase +
                    i * 0.25
                ) %
                1;

            g.circle(
                startX +
                    (
                        endX -
                        startX
                    ) *
                    t,
                startY +
                    (
                        endY -
                        startY
                    ) *
                    t,
                5 +
                    i * 0.7,
            );
            g.fill();
        }
    }

    private destroyReviveVisual(
        companion:
            CompanionRuntime,
    ): void {
        const visual =
            companion.reviveVisual;

        if (
            visual &&
            visual.isValid
        ) {
            visual.destroy();
        }

        companion.reviveVisual =
            null;
    }

    private createCompanionVisual(
        node: Node,
        definition:
            CharacterDefinition,
        mode:
            ProfessionAttackMode,
    ):
        CutoutCharacterAnimator | null {
        if (
            definition.id ===
            'mage'
        ) {
            const visual =
                new Node(
                    'CutoutVisual',
                );

            visual.layer =
                Layers.Enum.UI_2D;

            node.addChild(visual);

            visual.setPosition(
                0,
                1,
                0,
            );

            const animator =
                visual.addComponent(
                    CutoutCharacterAnimator,
                );

            void animator
                .setupMage()
                .catch((error) => {
                    /**
                     * 伙伴视觉是异步可选增强，失败不能变成未处理 PromiseRejection
                     * 影响整场编辑器预览。
                     */
                    console.error(
                        '[今晚守城] 伙伴元素法师拆件模型创建失败',
                        error,
                    );

                    if (
                        visual.isValid
                    ) {
                        visual.destroy();
                    }
                });

            this.createNameLabel(
                node,
                definition.name,
                -56,
            );

            return animator;
        }

        this.drawPlaceholderCompanion(
            node,
            mode,
        );

        this.createNameLabel(
            node,
            definition.name,
            -50,
        );

        return null;
    }

    private updateCompanion(
        companion:
            CompanionRuntime,
        dt: number,
    ): void {
        /**
         * v0.4.12：AI 英雄只处理自己“可到达/可攻击”的战斗区目标。
         * 玩家主角仍然可以主动进入泉水区堵怪，但 AI 英雄不再跟上去单挑。
         *
         * engageBounds 已按该英雄职业射程扩展，所以远程英雄可以站在
         * 主战场边缘攻击刚进入射程的怪物，近战英雄则只锁定更靠近战线的目标。
         */
        const enemy =
            EnemyController.instance
                ?.findNearestEnemyInBounds(
                    companion
                        .node
                        .position,
                    companion
                        .engageBounds,
                );

        if (enemy) {
            companion.patrolTarget =
                null;

            companion
                .patrolPauseRemaining =
                0;

            this.updateCombat(
                companion,
                enemy,
                dt,
            );

            return;
        }

        this.updateFreePatrol(
            companion,
            dt,
        );
    }

    private updateCombat(
        companion:
            CompanionRuntime,
        enemy:
            EnemyTarget,
        dt: number,
    ): void {
        if (!enemy.node.isValid) {
            return;
        }

        const selfPos =
            companion
                .node
                .position;

        const targetPos =
            enemy.node.position;

        const distance =
            this.distance(
                selfPos.x,
                selfPos.y,
                targetPos.x,
                targetPos.y,
            );

        if (
            distance <=
            companion
                .profession
                .attackRange
        ) {
            companion
                .motionAnimator
                ?.setMoving(false);

            this.tryAttack(
                companion,
                enemy,
            );

            return;
        }

        this.moveToward(
            companion,
            targetPos.x,
            targetPos.y,
            companion
                .combatant
                .moveSpeed *
                BATTLE_LAYOUT
                    .companionChaseSpeedMultiplier,
            dt,
        );
    }

    private updateFreePatrol(
        companion:
            CompanionRuntime,
        dt: number,
    ): void {
        if (
            companion
                .patrolPauseRemaining >
            0
        ) {
            companion
                .motionAnimator
                ?.setMoving(false);
            return;
        }

        if (
            !companion
                .patrolTarget
        ) {
            companion.patrolTarget =
                this.createRandomRoamTarget(
                    companion,
                );

            return;
        }

        const target =
            companion.patrolTarget;

        const pos =
            companion.node.position;

        const distance =
            this.distance(
                pos.x,
                pos.y,
                target.x,
                target.y,
            );

        if (distance <= 7) {
            companion
                .node
                .setPosition(
                    target.x,
                    target.y,
                    0,
                );

            companion
                .motionAnimator
                ?.setMoving(false);

            companion.patrolTarget =
                null;

            companion
                .patrolPauseRemaining =
                this.randomRange(
                    BATTLE_LAYOUT
                        .companionPatrolPauseMin,
                    BATTLE_LAYOUT
                        .companionPatrolPauseMax,
                );

            return;
        }

        this.moveToward(
            companion,
            target.x,
            target.y,
            Math.min(
                BATTLE_LAYOUT
                    .companionPatrolSpeed,
                companion
                    .combatant
                    .moveSpeed *
                    0.72,
            ),
            dt,
        );
    }

    /**
     * AI 英雄的目标区域 = 可移动区域 + 自身职业攻击射程。
     * 这样不会锁定永远够不到的泉水区怪物，也不会让远程英雄
     * 因为活动边界而无法攻击边界外、但实际已经进入射程的敌人。
     */
    private createEngageBounds(
        attackRange: number,
    ): EnemySearchBounds {
        const moveBounds =
            BATTLE_LAYOUT
                .aiHeroMoveBounds;

        const padding =
            Math.max(
                0,
                attackRange,
            );

        return {
            minX:
                moveBounds.minX -
                padding,
            maxX:
                moveBounds.maxX +
                padding,
            minY:
                moveBounds.minY -
                padding,
            maxY:
                moveBounds.maxY +
                padding,
        };
    }

    private createRandomRoamTarget(
        companion:
            CompanionRuntime,
    ): Vec2 {
        const anchor =
            BATTLE_LAYOUT
                .companionAnchors[
                    companion.slotIndex
                ];

        const bounds =
            BATTLE_LAYOUT
                .aiHeroMoveBounds;

        const x =
            this.randomRange(
                anchor.x -
                    BATTLE_LAYOUT
                        .companionGuardPatrolRadiusX,
                anchor.x +
                    BATTLE_LAYOUT
                        .companionGuardPatrolRadiusX,
            );

        const y =
            this.randomRange(
                anchor.y -
                    BATTLE_LAYOUT
                        .companionGuardPatrolRadiusY,
                anchor.y +
                    BATTLE_LAYOUT
                        .companionGuardPatrolRadiusY,
            );

        return new Vec2(
            Math.max(
                bounds.minX,
                Math.min(
                    bounds.maxX,
                    x,
                ),
            ),
            Math.max(
                bounds.minY,
                Math.min(
                    bounds.maxY,
                    y,
                ),
            ),
        );
    }

    private moveToward(
        companion:
            CompanionRuntime,
        targetX: number,
        targetY: number,
        speed: number,
        dt: number,
    ): void {
        const pos =
            companion.node.position;

        const dx =
            targetX - pos.x;

        const dy =
            targetY - pos.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy,
            );

        if (distance <= 0.001) {
            return;
        }

        companion
            .motionAnimator
            ?.setMoveDirection(
                new Vec2(dx, dy),
            );

        const moveDistance =
            Math.min(
                speed * dt,
                distance,
            );

        const bounds =
            BATTLE_LAYOUT
                .aiHeroMoveBounds;

        const nextX =
            Math.max(
                bounds.minX,
                Math.min(
                    bounds.maxX,
                    pos.x +
                        (
                            dx /
                            distance
                        ) *
                        moveDistance,
                ),
            );

        const nextY =
            Math.max(
                bounds.minY,
                Math.min(
                    bounds.maxY,
                    pos.y +
                        (
                            dy /
                            distance
                        ) *
                        moveDistance,
                ),
            );

        companion
            .node
            .setPosition(
                nextX,
                nextY,
                0,
            );
    }

    private tryAttack(
        companion:
            CompanionRuntime,
        enemy:
            EnemyTarget,
    ): void {
        if (
            companion.cooldown > 0 ||
            !enemy.node.isValid
        ) {
            return;
        }

        companion
            .motionAnimator
            ?.playAttack(
                companion
                    .profession
                    .attackMode ===
                    'magic'
                    ? 0.42
                    : 0.32,
            );

        const damage =
            companion
                .combatant
                .attackPower;

        if (
            companion
                .profession
                .attackMode ===
            'melee'
        ) {
            EnemyController.instance
                ?.takeDamageToEnemy(
                    enemy.node,
                    damage,
                );

            this.showMeleeSlash(
                enemy.node.position.x,
                enemy.node.position.y,
            );
        } else {
            this.spawnProjectile(
                companion,
                enemy.node,
                damage,
            );
        }

        companion.cooldown =
            companion
                .profession
                .attackInterval;
    }

    private spawnProjectile(
        companion:
            CompanionRuntime,
        target: Node,
        damage: number,
    ): void {
        const canvas =
            this.node.parent;

        if (!canvas) {
            return;
        }

        const projectile =
            new Node(
                'CompanionProjectile',
            );

        projectile.layer =
            Layers.Enum.UI_2D;

        BattleWorldService.ensure(canvas).addChild(projectile);

        projectile.setPosition(
            companion
                .node
                .position
                .x,
            companion
                .node
                .position
                .y +
                18,
            0,
        );

        projectile.addComponent(
            UITransform,
        ).setContentSize(
            24,
            24,
        );

        const g =
            projectile.addComponent(
                Graphics,
            );

        const color =
            this.getProjectileColor(
                companion
                    .profession
                    .attackMode,
            );

        if (
            companion
                .profession
                .attackMode ===
            'ranged'
        ) {
            g.strokeColor = color;
            g.lineWidth = 4;

            g.moveTo(-9, 0);
            g.lineTo(9, 0);
            g.stroke();

            g.fillColor = color;
            g.moveTo(10, 0);
            g.lineTo(3, 5);
            g.lineTo(3, -5);
            g.close();
            g.fill();
        } else {
            g.fillColor =
                new Color(
                    color.r,
                    color.g,
                    color.b,
                    80,
                );

            g.circle(
                0,
                0,
                10,
            );

            g.fill();

            g.fillColor = color;

            g.circle(
                0,
                0,
                5,
            );

            g.fill();
        }

        this.projectiles.push(
            {
                node: projectile,
                target,
                damage,
                speed:
                    companion
                        .profession
                        .projectileSpeed,
                mode:
                    companion
                        .profession
                        .attackMode,
            },
        );
    }

    private updateProjectiles(
        dt: number,
    ): void {
        for (
            let i =
                this.projectiles.length -
                1;
            i >= 0;
            i -= 1
        ) {
            const projectile =
                this.projectiles[i];

            if (
                !projectile
                    .node
                    .isValid ||
                !projectile
                    .target
                    .isValid
            ) {
                this.removeProjectile(i);
                continue;
            }

            const pos =
                projectile
                    .node
                    .position;

            const targetPos =
                projectile
                    .target
                    .position;

            const dx =
                targetPos.x -
                pos.x;

            const dy =
                targetPos.y -
                pos.y;

            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy,
                );

            const moveDistance =
                projectile.speed *
                dt;

            if (
                distance <= 16 ||
                distance <=
                    moveDistance
            ) {
                EnemyController.instance
                    ?.takeDamageToEnemy(
                        projectile.target,
                        projectile.damage,
                    );

                this.showProjectileHit(
                    targetPos.x,
                    targetPos.y,
                    projectile.mode,
                );

                this.removeProjectile(i);
                continue;
            }

            const direction =
                new Vec2(dx, dy);

            direction.normalize();

            projectile
                .node
                .setPosition(
                    pos.x +
                        direction.x *
                            moveDistance,
                    pos.y +
                        direction.y *
                            moveDistance,
                    0,
                );
        }
    }

    private removeProjectile(
        index: number,
    ): void {
        const projectile =
            this.projectiles[index];

        if (
            projectile?.node?.isValid
        ) {
            projectile.node.destroy();
        }

        this.projectiles.splice(
            index,
            1,
        );
    }

    private drawPlaceholderCompanion(
        node: Node,
        mode:
            ProfessionAttackMode,
    ): void {
        const g =
            node.addComponent(
                Graphics,
            );

        const roleColor =
            this.getRoleColor(mode);

        g.fillColor =
            new Color(
                90,
                75,
                62,
                75,
            );

        g.ellipse(
            0,
            -34,
            28,
            8,
        );

        g.fill();

        g.fillColor = roleColor;

        g.roundRect(
            -22,
            -28,
            44,
            58,
            14,
        );

        g.fill();

        g.fillColor =
            new Color(
                245,
                230,
                207,
                255,
            );

        g.circle(
            0,
            31,
            14,
        );

        g.fill();

        if (mode === 'ranged') {
            g.strokeColor =
                new Color(
                    96,
                    72,
                    54,
                    255,
                );

            g.lineWidth = 3;

            g.arc(
                30,
                4,
                17,
                -1.4,
                1.4,
            );

            g.stroke();
        } else if (
            mode === 'melee'
        ) {
            g.strokeColor =
                new Color(
                    82,
                    85,
                    90,
                    255,
                );

            g.lineWidth = 5;

            g.moveTo(
                24,
                -15,
            );

            g.lineTo(
                34,
                30,
            );

            g.stroke();
        } else {
            g.fillColor =
                new Color(
                    191,
                    116,
                    238,
                    255,
                );

            g.circle(
                29,
                27,
                7,
            );

            g.fill();
        }
    }

    private createNameLabel(
        node: Node,
        name: string,
        y: number,
    ): void {
        const nameNode =
            new Node('Name');

        nameNode.layer =
            Layers.Enum.UI_2D;

        node.addChild(nameNode);

        nameNode.setPosition(
            0,
            y,
            0,
        );

        nameNode.addComponent(
            UITransform,
        ).setContentSize(
            110,
            24,
        );

        const label =
            nameNode.addComponent(
                Label,
            );

        label.string = name;
        label.fontSize = 14;
        label.lineHeight = 18;

        label.color =
            new Color(
                67,
                67,
                67,
                255,
            );
    }

    private showMeleeSlash(
        x: number,
        y: number,
    ): void {
        const canvas =
            this.node.parent;

        if (!canvas) {
            return;
        }

        const hit =
            new Node(
                'MeleeSlash',
            );

        hit.layer =
            Layers.Enum.UI_2D;

        BattleWorldService.ensure(canvas).addChild(hit);

        hit.setPosition(
            x,
            y,
            0,
        );

        const g =
            hit.addComponent(
                Graphics,
            );

        g.strokeColor =
            new Color(
                255,
                211,
                91,
                235,
            );

        g.lineWidth = 5;

        g.moveTo(-14, 15);
        g.lineTo(14, -15);
        g.stroke();

        this.scheduleOnce(
            () => {
                if (hit.isValid) {
                    hit.destroy();
                }
            },
            0.08,
        );
    }

    private showProjectileHit(
        x: number,
        y: number,
        mode:
            ProfessionAttackMode,
    ): void {
        const canvas =
            this.node.parent;

        if (!canvas) {
            return;
        }

        const hit =
            new Node(
                'CompanionHit',
            );

        hit.layer =
            Layers.Enum.UI_2D;

        BattleWorldService.ensure(canvas).addChild(hit);

        hit.setPosition(
            x,
            y,
            0,
        );

        const g =
            hit.addComponent(
                Graphics,
            );

        g.strokeColor =
            this.getProjectileColor(
                mode,
            );

        g.lineWidth = 4;

        g.circle(
            0,
            0,
            14,
        );

        g.stroke();

        this.scheduleOnce(
            () => {
                if (hit.isValid) {
                    hit.destroy();
                }
            },
            0.08,
        );
    }

    private getRoleColor(
        mode:
            ProfessionAttackMode,
    ): Color {
        switch (mode) {
            case 'ranged':
                return new Color(
                    104,
                    185,
                    112,
                    255,
                );

            case 'magic':
                return new Color(
                    127,
                    96,
                    191,
                    255,
                );

            case 'support':
                return new Color(
                    204,
                    173,
                    86,
                    255,
                );

            case 'melee':
            default:
                return new Color(
                    102,
                    133,
                    190,
                    255,
                );
        }
    }

    private getProjectileColor(
        mode:
            ProfessionAttackMode,
    ): Color {
        switch (mode) {
            case 'ranged':
                return new Color(
                    239,
                    206,
                    95,
                    255,
                );

            case 'support':
                return new Color(
                    107,
                    224,
                    170,
                    255,
                );

            case 'magic':
            default:
                return new Color(
                    183,
                    101,
                    235,
                    255,
                );
        }
    }

    private getRegistryId(
        companionId: string,
    ): string {
        return (
            `companion:${companionId}`
        );
    }

    private distance(
        ax: number,
        ay: number,
        bx: number,
        by: number,
    ): number {
        const dx =
            bx - ax;

        const dy =
            by - ay;

        return Math.sqrt(
            dx * dx +
            dy * dy,
        );
    }

    private randomRange(
        min: number,
        max: number,
    ): number {
        return (
            min +
            Math.random() *
                (
                    max -
                    min
                )
        );
    }
}
