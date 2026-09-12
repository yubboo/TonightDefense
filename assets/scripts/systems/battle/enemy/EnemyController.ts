/**
 * @architecture TonightDefense V1.0
 * @owner battle
 * @module enemy
 *
 * EnemyController 只负责“怪物战斗运行时”。
 *
 * 什么时候刷怪、刷多少、Boss什么时候来，
 * 全部交给 LevelSystem > ChapterWaveController。
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
    Vec3,
} from 'cc';

import {
    ExperienceSystem,
} from '../../progression/experience/ExperienceSystem';

import {
    DropSystem,
} from '../drop/DropSystem';

import {
    BATTLE_LAYOUT,
} from '../data/BattleLayoutConfig';

import {
    BattleWorldService,
} from '../view/BattleWorldService';

import {
    MainHeroController,
} from '../../character/player/MainHeroController';

import {
    BattleCharacterTarget,
    BattleTargetRegistry,
} from '../targeting/BattleTargetRegistry';

import {
    DefenseObjectiveKind,
    DefenseObjectiveService,
} from '../objective/DefenseObjectiveService';

import {
    EnemyArchetype,
    EnemyDeathEvent,
    EnemyRank,
    EnemySpawnSpec,
    ENEMY_PROFILES,
} from './EnemyTypes';

import {
    getBossDefinition,
} from './boss/BossCatalog';

import {
    BossRuntimeController,
} from './boss/BossRuntimeController';

import {
    BossHealthHUD,
} from '../../../ui/hud/BossHealthHUD';

import {
    BattleStatisticsService,
} from '../statistics/BattleStatisticsService';

const {
    ccclass,
    property,
} = _decorator;

interface EnemyRuntime {
    id: number;
    node: Node;

    archetype:
        EnemyArchetype;

    rank:
        EnemyRank;

    enemyLevel: number;

    maxHp: number;
    hp: number;

    defense: number;
    moveSpeed: number;

    damage: number;
    attackInterval: number;
    attackRange: number;
    aggroRange: number;

    projectileSpeed: number;
    expReward: number;

    cooldown: number;

    hpFill:
        Node | null;

    bossRuntime:
        BossRuntimeController | null;
}

export interface EnemyTarget {
    id: number;
    node: Node;
    archetype: EnemyArchetype;
    rank: EnemyRank;
}

/**
 * 敌人查询区域。
 * AI 英雄用它限制自己只选择“实际能够进入攻击距离”的目标，
 * 避免隔着活动边界锁定泉水区怪物后一直顶着边界空跑。
 */
export interface EnemySearchBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}

interface EnemyAttackTarget {
    kind:
        'character' |
        'objective';

    target:
        BattleCharacterTarget | null;

    objective:
        DefenseObjectiveKind | null;
}

interface EnemyTargetPosition {
    readonly x: number;
    readonly y: number;
}

interface EnemyProjectile {
    node: Node;
    speed: number;
    damage: number;

    characterTarget:
        BattleCharacterTarget | null;

    objectiveTarget:
        DefenseObjectiveKind | null;
}

export type EnemyDeathListener =
    (
        event:
            EnemyDeathEvent,
    ) => void;

@ccclass('EnemyController')
export class EnemyController
extends Component {
    static instance:
        EnemyController | null =
        null;

    /**
     * 只限制“同时活着”的怪物数量。
     * 每一波总数量可以远大于这个值。
     */
    @property
    maxActiveEnemies = 16;

    private readonly enemies:
        EnemyRuntime[] = [];

    private readonly projectiles:
        EnemyProjectile[] = [];

    /**
     * 选敌发生在每只怪每一帧。复用同一个临时对象，
     * 避免在微信小游戏里持续制造短命对象触发 GC。
     * selectTarget 的返回值只在当前 updateEnemy 调用栈内同步使用。
     */
    private readonly attackTargetScratch:
        EnemyAttackTarget = {
            kind: 'objective',
            target: null,
            objective: null,
        };

    private nextEnemyId = 1;

    private deathListener:
        EnemyDeathListener | null =
        null;

    private bossHud:
        BossHealthHUD | null =
        null;

    onLoad(): void {
        EnemyController.instance =
            this;
    }

    start(): void {
        console.log(
            '[今晚守城] EnemyController 已交由 LevelSystem 控制刷怪',
        );
    }

    onDestroy(): void {
        if (
            EnemyController.instance ===
            this
        ) {
            EnemyController.instance =
                null;
        }

        this.clearAllEnemies(
            false,
        );

        this.clearEnemyProjectiles();

        this.destroyBossHud();
    }

    update(
        dt: number,
    ): void {
        if (
            DefenseObjectiveService
                .isGameOver
        ) {
            return;
        }

        /**
         * 高频循环不再 [...this.enemies] 复制数组。
         * 微信小游戏里这种每帧短命数组会增加 GC 抖动。
         * 倒序遍历也能安全兼容后续可能发生的 splice。
         */
        for (
            let i =
                this.enemies.length - 1;
            i >= 0;
            i -= 1
        ) {
            const enemy =
                this.enemies[i];

            if (!enemy) {
                continue;
            }

            this.updateEnemy(
                enemy,
                dt,
            );
        }

        this.updateProjectiles(
            dt,
        );
    }

    get aliveCount(): number {
        return this.enemies.length;
    }

    get canSpawn(): boolean {
        return (
            this.enemies.length <
            this.maxActiveEnemies
        );
    }

    /**
     * 兼容旧系统读取。
     */
    get targetNode():
        Node | null {
        return (
            this.enemies[0]
                ?.node ??
            null
        );
    }

    get isAlive(): boolean {
        return (
            this.enemies.length >
            0
        );
    }

    setDeathListener(
        listener:
            EnemyDeathListener | null,
    ): void {
        this.deathListener =
            listener;
    }

    spawnEnemy(
        spec:
            EnemySpawnSpec,
    ): number | null {
        if (!this.canSpawn) {
            return null;
        }

        const canvas =
            this.node.parent;

        if (!canvas) {
            return null;
        }

        const base =
            ENEMY_PROFILES[
                spec.archetype
            ];

        const rankHp =
            spec.rank ===
                'elite'
                ? 1.85
                : 1;

        const rankAttack =
            spec.rank ===
                'elite'
                ? 1.28
                : 1;

        const rankDefense =
            spec.rank ===
                'elite'
                ? 2
                : 0;

        const rankScale =
            spec.rank ===
                'elite'
                ? 1.13
                : 1;

        const rankExp =
            spec.rank ===
                'elite'
                ? 1.8
                : 1;

        const maxHp =
            Math.max(
                1,
                Math.round(
                    base.maxHp *
                    spec.hpMultiplier *
                    rankHp,
                ),
            );

        const damage =
            Math.max(
                1,
                Math.round(
                    base.damage *
                    spec.attackMultiplier *
                    rankAttack,
                ),
            );

        const defense =
            Math.max(
                0,
                Math.round(
                    base.defense +
                    spec.defenseBonus +
                    rankDefense,
                ),
            );

        const moveSpeed =
            Math.max(
                18,
                base.moveSpeed *
                    spec.speedMultiplier,
            );

        const visualScale =
            base.visualScale *
            rankScale;

        const enemyId =
            this.nextEnemyId++;

        const enemyNode =
            new Node(
                `Enemy_${spec.rank}_${spec.archetype}_${enemyId}`,
            );

        enemyNode.layer =
            Layers.Enum.UI_2D;

        BattleWorldService.ensure(canvas).addChild(
            enemyNode,
        );

        enemyNode.addComponent(
            UITransform,
        ).setContentSize(
            82 * visualScale,
            94 * visualScale,
        );

        enemyNode.setScale(
            visualScale,
            visualScale,
            1,
        );

        /**
         * v0.4.9 路线 B：怪物只从上半区固定“泉水”来袭。
         * 以主角当前 X 为基准，找到最近的泉水，再从它和左右相邻泉水中随机选择。
         * 因此玩家看到的主要方向始终是左上 / 上 / 右上，同时可以主动上去堵泉水。
         */
        const spawnConfig =
            BATTLE_LAYOUT
                .enemySpawn;

        const heroX =
            MainHeroController
                .instance
                ?.targetNode
                ?.position
                .x ??
            0;

        const fountains =
            spawnConfig.fountains;

        let nearestIndex = 0;
        let nearestDistance =
            Number.POSITIVE_INFINITY;

        for (
            let i = 0;
            i < fountains.length;
            i += 1
        ) {
            const distance =
                Math.abs(
                    fountains[i].x -
                    heroX,
                );

            if (
                distance <
                nearestDistance
            ) {
                nearestDistance =
                    distance;
                nearestIndex = i;
            }
        }

        const candidateIndices:
            number[] = [];

        for (
            let offset = -1;
            offset <= 1;
            offset += 1
        ) {
            const index =
                nearestIndex +
                offset;

            if (
                index >= 0 &&
                index <
                    fountains.length
            ) {
                candidateIndices.push(
                    index,
                );
            }
        }

        /** 边缘泉水不足 3 个候选时，补最近的内侧泉水。 */
        if (
            candidateIndices.length < 3 &&
            fountains.length >= 3
        ) {
            const fallbackIndex =
                nearestIndex <= 1
                    ? 2
                    : fountains.length - 3;

            if (
                !candidateIndices.includes(
                    fallbackIndex,
                )
            ) {
                candidateIndices.push(
                    fallbackIndex,
                );
            }
        }

        const selectedIndex =
            candidateIndices[
                Math.floor(
                    Math.random() *
                    candidateIndices.length,
                )
            ];

        const fountain =
            fountains[
                selectedIndex
            ];

        enemyNode.setPosition(
            fountain.x +
                this.randomRange(
                    -spawnConfig.jitterX,
                    spawnConfig.jitterX,
                ),

            fountain.y +
                this.randomRange(
                    -spawnConfig.jitterY,
                    spawnConfig.jitterY,
                ),

            0,
        );

        this.drawEnemy(
            enemyNode,
            spec.archetype,
            spec.rank,
        );

        const hpFill =
            this.createHpBar(
                enemyNode,
                spec.rank,
            );

        const bossDefinition =
            spec.rank ===
                'boss'
                ? getBossDefinition(
                    spec.bossId ??
                        'flame_dragon',
                )
                : null;

        const bossRuntime =
            bossDefinition
                ? new BossRuntimeController(
                    enemyNode,
                    canvas,
                    bossDefinition,
                    damage,
                )
                : null;

        if (bossDefinition) {
            this.destroyBossHud();

            this.bossHud =
                new BossHealthHUD(
                    canvas,
                    bossDefinition
                        .displayName,
                    bossDefinition
                        .title,
                );

            this.bossHud.update(
                maxHp,
                maxHp,
                1,
                bossDefinition
                    .phases[0]
                    .displayName,
            );
        }

        this.enemies.push(
            {
                id: enemyId,
                node: enemyNode,

                archetype:
                    spec.archetype,

                rank:
                    spec.rank,

                enemyLevel:
                    spec.enemyLevel,

                maxHp,
                hp: maxHp,

                defense,
                moveSpeed,

                damage,

                attackInterval:
                    base.attackInterval,

                attackRange:
                    base.attackRange,

                aggroRange:
                    base.aggroRange,

                projectileSpeed:
                    base.projectileSpeed,

                expReward:
                    Math.max(
                        1,
                        Math.round(
                            base.expReward *
                            rankExp *
                            (
                                1 +
                                spec.enemyLevel *
                                    0.018
                            ),
                        ),
                    ),

                cooldown:
                    this.randomRange(
                        0.15,
                        base.attackInterval,
                    ),

                hpFill,

                bossRuntime,
            },
        );

        return enemyId;
    }

    findNearestEnemy(
        position:
            Vec3 | Vec2,
        maxDistance =
            Number.POSITIVE_INFINITY,
    ):
        EnemyTarget | null {
        return this.findNearestEnemyInternal(
            position,
            maxDistance,
            null,
        );
    }

    /**
     * 在指定区域里找距离最近的存活怪物。
     *
     * 由 EnemyController 统一维护敌人查询逻辑，AI 英雄只提供自己的
     * 可交战区域，不复制 enemies 遍历。
     */
    findNearestEnemyInBounds(
        position:
            Vec3 | Vec2,
        bounds:
            EnemySearchBounds,
        maxDistance =
            Number.POSITIVE_INFINITY,
    ):
        EnemyTarget | null {
        return this.findNearestEnemyInternal(
            position,
            maxDistance,
            bounds,
        );
    }

    findEnemiesInRadius(
        position: Vec3 | Vec2,
        radius: number,
    ): EnemyTarget[] {
        const radiusSq =
            Math.max(0, radius) *
            Math.max(0, radius);

        const result:
            EnemyTarget[] = [];

        for (const enemy of this.enemies) {
            if (
                enemy.hp <= 0 ||
                !enemy.node.isValid
            ) {
                continue;
            }

            const dx =
                enemy.node.position.x -
                position.x;
            const dy =
                enemy.node.position.y -
                position.y;

            if (dx * dx + dy * dy > radiusSq) {
                continue;
            }

            result.push({
                id: enemy.id,
                node: enemy.node,
                archetype: enemy.archetype,
                rank: enemy.rank,
            });
        }

        return result;
    }

    damageEnemiesInRadius(
        position: Vec3 | Vec2,
        radius: number,
        rawDamage: number,
        knockback = 0,
    ): number {
        const targets =
            this.findEnemiesInRadius(
                position,
                radius,
            );

        for (const target of targets) {
            if (knockback > 0) {
                const pos = target.node.position;
                const dx = pos.x - position.x;
                const dy = pos.y - position.y;
                const length =
                    Math.max(
                        0.001,
                        Math.sqrt(dx * dx + dy * dy),
                    );

                target.node.setPosition(
                    pos.x + dx / length * knockback,
                    pos.y + dy / length * knockback,
                    pos.z,
                );
            }

            this.takeDamageToEnemy(
                target.node,
                rawDamage,
            );
        }

        return targets.length;
    }

    private findNearestEnemyInternal(
        position:
            Vec3 | Vec2,
        maxDistance: number,
        bounds:
            EnemySearchBounds | null,
    ):
        EnemyTarget | null {
        let best:
            EnemyRuntime | null =
            null;

        let bestDistanceSq =
            maxDistance *
            maxDistance;

        for (
            const enemy
            of this.enemies
        ) {
            if (
                enemy.hp <= 0 ||
                !enemy.node.isValid
            ) {
                continue;
            }

            const pos =
                enemy.node.position;

            if (
                bounds &&
                (
                    pos.x < bounds.minX ||
                    pos.x > bounds.maxX ||
                    pos.y < bounds.minY ||
                    pos.y > bounds.maxY
                )
            ) {
                continue;
            }

            const dx =
                pos.x -
                position.x;

            const dy =
                pos.y -
                position.y;

            const distanceSq =
                dx * dx +
                dy * dy;

            if (
                distanceSq <
                bestDistanceSq
            ) {
                bestDistanceSq =
                    distanceSq;

                best = enemy;
            }
        }

        if (!best) {
            return null;
        }

        return {
            id: best.id,
            node: best.node,
            archetype:
                best.archetype,
            rank:
                best.rank,
        };
    }

    /**
     * 兼容旧接口。
     */
    takeDamage(
        amount: number,
    ): void {
        const enemy =
            this.enemies[0];

        if (enemy) {
            this.applyDamage(
                enemy,
                amount,
            );
        }
    }

    takeDamageToEnemy(
        targetNode: Node,
        rawDamage: number,
    ): void {
        const enemy =
            this.enemies.find(
                (item) =>
                    item.node ===
                    targetNode,
            );

        if (!enemy) {
            return;
        }

        this.applyDamage(
            enemy,
            rawDamage,
        );
    }

    /**
     * Boss 出场前的“清场”使用。
     * awardExp=false 时不发经验，也不算正常击杀。
     */
    clearAllEnemies(
        awardExp = false,
    ): void {
        const copy =
            [...this.enemies];

        this.enemies.length = 0;

        for (
            const enemy
            of copy
        ) {
            enemy.bossRuntime
                ?.destroy();

            if (awardExp) {
                ExperienceSystem.instance
                    ?.addExp(
                        enemy.expReward,
                    );
            }

            if (
                enemy.node.isValid
            ) {
                enemy.node.destroy();
            }
        }

        this.destroyBossHud();
    }

    clearEnemyProjectiles(): void {
        for (
            const projectile
            of this.projectiles
        ) {
            if (
                projectile.node.isValid
            ) {
                projectile.node.destroy();
            }
        }

        this.projectiles.length = 0;
    }

    private updateEnemy(
        enemy:
            EnemyRuntime,
        dt: number,
    ): void {
        if (
            enemy.hp <= 0 ||
            !enemy.node.isValid
        ) {
            return;
        }

        if (enemy.bossRuntime) {
            const casting =
                enemy.bossRuntime
                    .update(
                        dt,
                        enemy.hp /
                            enemy.maxHp,
                    );

            this.bossHud?.update(
                enemy.hp,
                enemy.maxHp,
                enemy.bossRuntime
                    .phaseNumber,
                enemy.bossRuntime
                    .phaseName,
            );

            if (casting) {
                return;
            }
        }

        enemy.cooldown -= dt;

        const target =
            this.selectTarget(
                enemy,
            );

        if (!target) {
            return;
        }

        const targetPosition =
            this.getAttackTargetPosition(
                target,
            );

        if (!targetPosition) {
            return;
        }

        const pos =
            enemy.node.position;

        const dx =
            targetPosition.x -
            pos.x;

        const dy =
            targetPosition.y -
            pos.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy,
            );

        if (
            distance <=
            enemy.attackRange
        ) {
            this.tryEnemyAttack(
                enemy,
                target,
            );

            return;
        }

        if (
            distance <= 0.001
        ) {
            return;
        }

        const moveDistance =
            Math.min(
                enemy.moveSpeed *
                    (
                        enemy.bossRuntime
                            ?.moveSpeedMultiplier ??
                        1
                    ) *
                    dt,
                distance,
            );

        enemy.node.setPosition(
            pos.x +
                (
                    dx /
                    distance
                ) *
                moveDistance,

            pos.y +
                (
                    dy /
                    distance
                ) *
                moveDistance,

            0,
        );
    }

    private selectTarget(
        enemy:
            EnemyRuntime,
    ):
        EnemyAttackTarget | null {
        const pos =
            enemy.node.position;

        /**
         * 攻击优先级：
         * 玩家控制主角与 AI 控制伙伴都属于统一 Hero 目标。
         * 只要任意英雄仍存活，怪物就先攻击距离自己最近的英雄；
         * 全部英雄死亡/不可用后，才进入
         * 雕像 -> 城墙 -> 公主 的防线顺序。
         */
        const character =
            BattleTargetRegistry
                .findNearest(
                    pos.x,
                    pos.y,
                );

        if (character) {
            this.attackTargetScratch.kind =
                'character';
            this.attackTargetScratch.target =
                character;
            this.attackTargetScratch.objective =
                null;

            return this.attackTargetScratch;
        }

        const objective =
            DefenseObjectiveService
                .getActiveObjective();

        if (!objective) {
            return null;
        }

        this.attackTargetScratch.kind =
            'objective';
        this.attackTargetScratch.target =
            null;
        this.attackTargetScratch.objective =
            objective;

        return this.attackTargetScratch;
    }

    private getAttackTargetPosition(
        target:
            EnemyAttackTarget,
    ): EnemyTargetPosition | null {
        if (
            target.kind ===
            'character'
        ) {
            if (
                !this.isUsableCharacterTarget(
                    target.target,
                )
            ) {
                return null;
            }

            return target.target.node.position;
        }

        if (!target.objective) {
            return null;
        }

        return (
            DefenseObjectiveService
                .getObjectivePosition(
                    target.objective,
                )
        );
    }

    private tryEnemyAttack(
        enemy:
            EnemyRuntime,
        target:
            EnemyAttackTarget,
    ): void {
        if (
            enemy.cooldown >
            0
        ) {
            return;
        }

        if (
            enemy.archetype ===
            'ranged'
        ) {
            this.spawnEnemyProjectile(
                enemy,
                target,
            );
        } else {
            this.applyEnemyAttack(
                enemy,
                target,
            );

            this.showMeleeHit(
                enemy.node.position.x,
                enemy.node.position.y,
            );
        }

        enemy.cooldown =
            enemy.attackInterval *
            (
                enemy.bossRuntime
                    ?.attackIntervalMultiplier ??
                1
            );
    }

    /**
     * 角色目标来自静态注册表，也会被远程弹道暂存。
     * 热重载或旧构建残留时，历史目标结构可能缺少 isAlive/takeDamage。
     * 统一在这里做运行时保护，避免 update 每帧抛错导致游戏卡死。
     */
    private isUsableCharacterTarget(
        target:
            BattleCharacterTarget | null | undefined,
    ): target is BattleCharacterTarget {
        if (
            !target ||
            !target.node ||
            !target.node.isValid ||
            typeof target.isAlive !==
                'function' ||
            typeof target.takeDamage !==
                'function'
        ) {
            if (target?.id) {
                BattleTargetRegistry.unregister(
                    target.id,
                );
            }

            return false;
        }

        try {
            return Boolean(
                target.isAlive.call(
                    target,
                ),
            );
        } catch (error) {
            console.warn(
                '[今晚守城] EnemyController 忽略非法角色目标',
                target.id ??
                    '<unknown>',
                error,
            );

            BattleTargetRegistry.unregister(
                target.id,
            );

            return false;
        }
    }

    private applyEnemyAttack(
        enemy:
            EnemyRuntime,
        target:
            EnemyAttackTarget,
    ): void {
        if (
            target.kind ===
            'character'
        ) {
            const characterTarget =
                target.target;

            if (
                this.isUsableCharacterTarget(
                    characterTarget,
                )
            ) {
                characterTarget.takeDamage(
                    enemy.damage,
                );
            }

            return;
        }

        if (!target.objective) {
            return;
        }

        DefenseObjectiveService
            .takeDamage(
                target.objective,
                enemy.damage,
            );
    }

    private spawnEnemyProjectile(
        enemy:
            EnemyRuntime,
        target:
            EnemyAttackTarget,
    ): void {
        const canvas =
            this.node.parent;

        if (!canvas) {
            return;
        }

        const projectile =
            new Node(
                'EnemyProjectile',
            );

        projectile.layer =
            Layers.Enum.UI_2D;

        BattleWorldService.ensure(canvas).addChild(
            projectile,
        );

        projectile.setPosition(
            enemy.node.position.x,
            enemy.node.position.y -
                6,
            0,
        );

        projectile.addComponent(
            UITransform,
        ).setContentSize(
            18,
            18,
        );

        const g =
            projectile.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                229,
                119,
                91,
                100,
            );

        g.circle(
            0,
            0,
            9,
        );

        g.fill();

        g.fillColor =
            new Color(
                236,
                86,
                78,
                255,
            );

        g.circle(
            0,
            0,
            5,
        );

        g.fill();

        this.projectiles.push(
            {
                node:
                    projectile,

                speed:
                    enemy.projectileSpeed,

                damage:
                    enemy.damage,

                characterTarget:
                    target.kind ===
                        'character'
                        ? target.target
                        : null,

                objectiveTarget:
                    target.kind ===
                        'objective'
                        ? target.objective
                        : null,
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
                    .isValid
            ) {
                this.projectiles.splice(
                    i,
                    1,
                );

                continue;
            }

            const targetPosition =
                this.getProjectileTargetPosition(
                    projectile,
                );

            if (!targetPosition) {
                this.removeEnemyProjectile(
                    i,
                );
                continue;
            }

            const pos =
                projectile
                    .node
                    .position;

            const dx =
                targetPosition.x -
                pos.x;

            const dy =
                targetPosition.y -
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
                distance <= 12 ||
                distance <=
                    moveDistance
            ) {
                const characterTarget =
                    projectile
                        .characterTarget;

                if (
                    this.isUsableCharacterTarget(
                        characterTarget,
                    )
                ) {
                    characterTarget
                        .takeDamage(
                            projectile.damage,
                        );
                } else if (
                    projectile
                        .objectiveTarget
                ) {
                    DefenseObjectiveService
                        .takeDamage(
                            projectile
                                .objectiveTarget,
                            projectile.damage,
                        );
                }

                this.removeEnemyProjectile(
                    i,
                );

                continue;
            }

            projectile.node.setPosition(
                pos.x +
                    (
                        dx /
                        distance
                    ) *
                    moveDistance,

                pos.y +
                    (
                        dy /
                        distance
                    ) *
                    moveDistance,

                0,
            );
        }
    }

    private getProjectileTargetPosition(
        projectile:
            EnemyProjectile,
    ): EnemyTargetPosition | null {
        if (
            projectile
                .characterTarget
        ) {
            const characterTarget =
                projectile
                    .characterTarget;

            if (
                !this.isUsableCharacterTarget(
                    characterTarget,
                )
            ) {
                return null;
            }

            return characterTarget
                .node
                .position;
        }

        if (
            projectile
                .objectiveTarget
        ) {
            return (
                DefenseObjectiveService
                    .getObjectivePosition(
                        projectile
                            .objectiveTarget,
                    )
            );
        }

        return null;
    }

    private applyDamage(
        enemy:
            EnemyRuntime,
        rawDamage: number,
    ): void {
        if (
            enemy.hp <= 0
        ) {
            return;
        }

        const actualDamage =
            rawDamage <= 0
                ? 0
                : Math.max(
                    1,
                    Math.round(
                        rawDamage -
                        enemy.defense,
                    ),
                );

        BattleStatisticsService.instance
            ?.recordDamage(
                Math.min(
                    enemy.hp,
                    actualDamage,
                ),
            );

        enemy.hp =
            Math.max(
                0,
                enemy.hp -
                    actualDamage,
            );

        this.refreshEnemyHp(
            enemy,
        );

        if (enemy.bossRuntime) {
            this.bossHud?.update(
                enemy.hp,
                enemy.maxHp,
                enemy.bossRuntime
                    .phaseNumber,
                enemy.bossRuntime
                    .phaseName,
            );
        }

        if (
            enemy.hp <= 0
        ) {
            this.killEnemy(
                enemy,
            );
        }
    }

    private killEnemy(
        enemy:
            EnemyRuntime,
    ): void {
        const position =
            enemy.node
                .position
                .clone();

        BattleStatisticsService.instance
            ?.recordEnemyDefeated();

        ExperienceSystem.instance
            ?.addExp(
                enemy.expReward,
            );

        this.showExpText(
            position.x,
            position.y,
            enemy.expReward,
        );

        const index =
            this.enemies.indexOf(
                enemy,
            );

        if (
            index >= 0
        ) {
            this.enemies.splice(
                index,
                1,
            );
        }

        enemy.bossRuntime
            ?.destroy();

        if (
            enemy.rank ===
            'boss'
        ) {
            this.destroyBossHud();
        }

        const deathEvent:
            EnemyDeathEvent = {
                enemyId:
                    enemy.id,

                archetype:
                    enemy.archetype,

                rank:
                    enemy.rank,

                enemyLevel:
                    enemy.enemyLevel,
            };

        /**
         * BattleSystem 内部先处理真实掉落，
         * 再通知 LevelSystem 统计击杀/波次。
         */
        const dropResult =
            DropSystem.resolveEnemyDeath(
                deathEvent,
            );

        const coinDrop =
            dropResult
                .currencies
                .find(
                    (
                        reward,
                    ) =>
                        reward.id ===
                        'coin',
                );

        if (
            coinDrop &&
            coinDrop.amount >
                0
        ) {
            this.showCoinDropText(
                position.x,
                position.y,
                coinDrop.amount,
            );
        }

        this.deathListener?.(
            deathEvent,
        );

        if (
            enemy.node.isValid
        ) {
            enemy.node.destroy();
        }
    }

    private destroyBossHud(): void {
        this.bossHud?.destroy();
        this.bossHud = null;
    }

    private drawEnemy(
        enemy: Node,
        archetype:
            EnemyArchetype,
        rank:
            EnemyRank,
    ): void {
        const g =
            enemy.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                88,
                68,
                65,
                65,
            );

        g.ellipse(
            0,
            -32,
            30,
            9,
        );

        g.fill();

        let bodyColor:
            Color;

        let accent:
            Color;

        if (
            archetype ===
            'ranged'
        ) {
            bodyColor =
                new Color(
                    73,
                    130,
                    151,
                    255,
                );

            accent =
                new Color(
                    111,
                    201,
                    215,
                    255,
                );
        } else if (
            archetype ===
            'boss'
        ) {
            bodyColor =
                new Color(
                    151,
                    40,
                    28,
                    255,
                );

            accent =
                new Color(
                    235,
                    170,
                    53,
                    255,
                );
        } else {
            bodyColor =
                new Color(
                    135,
                    91,
                    181,
                    255,
                );

            accent =
                new Color(
                    170,
                    128,
                    210,
                    255,
                );
        }

        if (
            rank ===
            'elite'
        ) {
            /**
             * 精英怪增加金色外环。
             */
            g.strokeColor =
                new Color(
                    232,
                    188,
                    71,
                    235,
                );

            g.lineWidth = 4;

            g.circle(
                0,
                -2,
                33,
            );

            g.stroke();
        }

        g.fillColor =
            bodyColor;

        g.circle(
            0,
            -2,
            28,
        );

        g.fill();

        g.fillColor =
            accent;

        g.moveTo(-22, 12);
        g.lineTo(-35, 29);
        g.lineTo(-14, 23);
        g.close();
        g.fill();

        g.moveTo(22, 12);
        g.lineTo(35, 29);
        g.lineTo(14, 23);
        g.close();
        g.fill();

        g.fillColor =
            new Color(
                245,
                245,
                245,
                255,
            );

        g.circle(-9, 3, 5);
        g.circle(9, 3, 5);
        g.fill();

        g.fillColor =
            new Color(
                38,
                30,
                49,
                255,
            );

        g.circle(-8, 2, 2.5);
        g.circle(8, 2, 2.5);
        g.fill();

        if (
            archetype ===
            'ranged'
        ) {
            g.strokeColor =
                new Color(
                    230,
                    181,
                    90,
                    255,
                );

            g.lineWidth = 3;

            g.arc(
                31,
                0,
                14,
                -1.2,
                1.2,
                false,
            );

            g.stroke();
        }

        if (
            archetype ===
            'boss'
        ) {
            g.fillColor =
                new Color(
                    223,
                    179,
                    69,
                    255,
                );

            g.moveTo(-15, 24);
            g.lineTo(-7, 39);
            g.lineTo(0, 28);
            g.lineTo(7, 39);
            g.lineTo(15, 24);
            g.close();
            g.fill();
        }
    }

    private createHpBar(
        enemy: Node,
        rank:
            EnemyRank,
    ): Node {
        const width =
            rank ===
                'boss'
                ? 132
                : 58;

        const root =
            new Node('EnemyHp');

        root.layer =
            Layers.Enum.UI_2D;

        enemy.addChild(root);

        root.setPosition(
            0,
            rank ===
                'boss'
                ? 94
                : 42,
            0,
        );

        root.addComponent(
            UITransform,
        ).setContentSize(
            width,
            10,
        );

        const bg =
            root.addComponent(
                Graphics,
            );

        bg.fillColor =
            new Color(
                42,
                42,
                46,
                225,
            );

        bg.roundRect(
            -width / 2,
            -4,
            width,
            8,
            4,
        );

        bg.fill();

        const fill =
            new Node('Fill');

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
            width - 4,
            4,
        );

        fill.setPosition(
            -width / 2 + 2,
            0,
            0,
        );

        const fg =
            fill.addComponent(
                Graphics,
            );

        fg.fillColor =
            rank ===
                'boss'
                ? new Color(
                    217,
                    93,
                    105,
                    255,
                )
                : rank ===
                    'elite'
                    ? new Color(
                        225,
                        181,
                        68,
                        255,
                    )
                    : new Color(
                        86,
                        205,
                        105,
                        255,
                    );

        fg.roundRect(
            0,
            -2,
            width - 4,
            4,
            2,
        );

        fg.fill();

        return fill;
    }

    private refreshEnemyHp(
        enemy:
            EnemyRuntime,
    ): void {
        if (!enemy.hpFill) {
            return;
        }

        const ratio =
            Math.max(
                0,
                Math.min(
                    1,
                    enemy.hp /
                    enemy.maxHp,
                ),
            );

        enemy.hpFill.setScale(
            ratio,
            1,
            1,
        );
    }


    private showCoinDropText(
        x: number,
        y: number,
        amount: number,
    ): void {
        const canvas =
            this.node.parent;

        if (!canvas) {
            return;
        }

        const textNode =
            new Node(
                'CoinDropText',
            );

        textNode.layer =
            Layers.Enum.UI_2D;

        BattleWorldService.ensure(canvas).addChild(
            textNode,
        );

        textNode.setPosition(
            x,
            y + 68,
            0,
        );

        textNode.addComponent(
            UITransform,
        ).setContentSize(
            120,
            28,
        );

        const label =
            textNode.addComponent(
                Label,
            );

        label.string =
            `+${amount} 金币`;

        label.fontSize = 16;
        label.lineHeight = 20;

        label.color =
            new Color(
                246,
                194,
                67,
                255,
            );

        this.scheduleOnce(
            () => {
                if (
                    textNode.isValid
                ) {
                    textNode.destroy();
                }
            },
            0.55,
        );
    }

    private showExpText(
        x: number,
        y: number,
        reward: number,
    ): void {
        const canvas =
            this.node.parent;

        if (!canvas) {
            return;
        }

        const textNode =
            new Node(
                'ExpRewardText',
            );

        textNode.layer =
            Layers.Enum.UI_2D;

        BattleWorldService.ensure(canvas).addChild(
            textNode,
        );

        textNode.setPosition(
            x,
            y + 45,
            0,
        );

        textNode.addComponent(
            UITransform,
        ).setContentSize(
            100,
            28,
        );

        const label =
            textNode.addComponent(
                Label,
            );

        label.string =
            `+${reward} EXP`;

        label.fontSize = 16;
        label.lineHeight = 20;

        label.color =
            new Color(
                84,
                196,
                231,
                255,
            );

        this.scheduleOnce(
            () => {
                if (
                    textNode.isValid
                ) {
                    textNode.destroy();
                }
            },
            0.45,
        );
    }

    private showMeleeHit(
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
                'EnemyMeleeHit',
            );

        hit.layer =
            Layers.Enum.UI_2D;

        BattleWorldService.ensure(canvas).addChild(hit);

        hit.setPosition(
            x,
            y - 8,
            0,
        );

        const g =
            hit.addComponent(
                Graphics,
            );

        g.strokeColor =
            new Color(
                231,
                110,
                88,
                225,
            );

        g.lineWidth = 4;

        g.moveTo(-12, 10);
        g.lineTo(12, -10);
        g.stroke();

        this.scheduleOnce(
            () => {
                if (
                    hit.isValid
                ) {
                    hit.destroy();
                }
            },
            0.07,
        );
    }

    private removeEnemyProjectile(
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
