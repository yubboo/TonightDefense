/**
 * @architecture TonightDefense V1.0
 * @owner battle
 * @module enemy/boss
 *
 * 单只 Boss 的技能与视觉运行时。
 * 不拥有生命、死亡、掉落或波次状态；这些仍由 EnemyController / LevelSystem 负责。
 */
import {
    Color,
    Graphics,
    Layers,
    Node,
    resources,
    Sprite,
    SpriteFrame,
    UITransform,
} from 'cc';

import {
    AudioManager,
} from '../../../audio/AudioManager';

import {
    DefenseObjectiveKind,
    DefenseObjectiveService,
} from '../../objective/DefenseObjectiveService';

import {
    BattleTargetRegistry,
} from '../../targeting/BattleTargetRegistry';

import {
    BattleWorldService,
} from '../../view/BattleWorldService';

import {
    BossDefinition,
    BossSkillDefinition,
} from './BossCatalog';

interface BossCastRuntime {
    skill: BossSkillDefinition;
    remaining: number;
    targetX: number;
    targetY: number;
    objective:
        DefenseObjectiveKind | null;
}

interface BossEffectRuntime {
    node: Node;
    remaining: number;
    duration: number;
}

export class BossRuntimeController {
    private readonly bossNode:
        Node;

    private readonly canvas:
        Node;

    private readonly definition:
        BossDefinition;

    private readonly baseDamage:
        number;

    private visualNode:
        Node | null = null;

    private telegraph:
        Node | null = null;

    private activeCast:
        BossCastRuntime | null = null;

    private readonly effects:
        BossEffectRuntime[] = [];

    private phaseIndex = 0;
    private skillIndex = 0;
    private skillCooldown = 2.4;
    private visualTime = 0;

    constructor(
        bossNode: Node,
        canvas: Node,
        definition: BossDefinition,
        baseDamage: number,
    ) {
        this.bossNode =
            bossNode;
        this.canvas = canvas;
        this.definition =
            definition;
        this.baseDamage =
            baseDamage;

        this.createVisual();
        this.createSpawnBurst();

        AudioManager.playSfx(
            'flame_dragon_roar',
            {
                volume: 0.92,
                minIntervalMs: 1200,
                throttleKey:
                    'flame_dragon_roar',
            },
        );
    }

    get phaseNumber(): number {
        return this.phaseIndex + 1;
    }

    get phaseName(): string {
        return this.definition
            .phases[this.phaseIndex]
            .displayName;
    }

    get moveSpeedMultiplier(): number {
        return this.definition
            .phases[this.phaseIndex]
            .moveSpeedMultiplier;
    }

    get attackIntervalMultiplier(): number {
        return this.definition
            .phases[this.phaseIndex]
            .attackIntervalMultiplier;
    }

    /**
     * 返回 true 表示 Boss 正在吟唱，本帧暂停普通移动/普攻。
     */
    update(
        dt: number,
        hpRatio: number,
    ): boolean {
        this.updateEffects(dt);
        this.updateVisual(dt);
        this.updatePhase(hpRatio);

        if (this.activeCast) {
            this.activeCast.remaining -=
                dt;

            if (
                this.activeCast.remaining <=
                0
            ) {
                this.resolveCast();
            }

            return true;
        }

        this.skillCooldown -= dt;

        if (this.skillCooldown <= 0) {
            this.beginNextSkill();
            return this.activeCast !== null;
        }

        return false;
    }

    destroy(): void {
        this.destroyTelegraph();

        for (
            const effect
            of this.effects
        ) {
            if (effect.node.isValid) {
                effect.node.destroy();
            }
        }

        this.effects.length = 0;
        this.activeCast = null;
    }

    private updatePhase(
        hpRatio: number,
    ): void {
        let nextPhase = 0;

        for (
            let i = 1;
            i <
                this.definition
                    .phases.length;
            i += 1
        ) {
            if (
                hpRatio <=
                this.definition
                    .phases[i]
                    .hpThreshold
            ) {
                nextPhase = i;
            }
        }

        if (
            nextPhase <=
            this.phaseIndex
        ) {
            return;
        }

        this.phaseIndex =
            nextPhase;
        this.skillIndex = 0;
        this.skillCooldown =
            Math.min(
                this.skillCooldown,
                0.7,
            );

        this.createPhaseBurst();

        AudioManager.playSfx(
            'flame_dragon_roar',
            {
                volume: 0.78,
                minIntervalMs: 1000,
                throttleKey:
                    'flame_dragon_phase',
            },
        );
    }

    private beginNextSkill(): void {
        const phase =
            this.definition
                .phases[this.phaseIndex];

        if (phase.skills.length <= 0) {
            this.skillCooldown = 1;
            return;
        }

        const skillId =
            phase.skills[
                this.skillIndex %
                phase.skills.length
            ];

        this.skillIndex += 1;

        const skill =
            this.definition
                .skills[skillId];

        const target =
            BattleTargetRegistry
                .findNearest(
                    this.bossNode
                        .position.x,
                    this.bossNode
                        .position.y,
                );

        let targetX =
            this.bossNode.position.x;
        let targetY =
            this.bossNode.position.y;
        let objective:
            DefenseObjectiveKind | null =
            null;

        if (
            skill.targetMode ===
            'target_area'
        ) {
            if (target) {
                targetX =
                    target.node.position.x;
                targetY =
                    target.node.position.y;
            } else {
                objective =
                    DefenseObjectiveService
                        .getActiveObjective();

                const position =
                    objective
                        ? DefenseObjectiveService
                            .getObjectivePosition(
                                objective,
                            )
                        : null;

                if (!position) {
                    this.skillCooldown = 0.8;
                    return;
                }

                targetX = position.x;
                targetY = position.y;
            }
        }

        this.activeCast = {
            skill,
            remaining:
                skill.castSeconds,
            targetX,
            targetY,
            objective,
        };

        this.createTelegraph(
            targetX,
            targetY,
            skill,
        );
    }

    private resolveCast(): void {
        const cast =
            this.activeCast;

        if (!cast) {
            return;
        }

        const centerX =
            cast.skill.targetMode ===
                'self_area'
                ? this.bossNode
                    .position.x
                : cast.targetX;

        const centerY =
            cast.skill.targetMode ===
                'self_area'
                ? this.bossNode
                    .position.y
                : cast.targetY;

        const damage =
            Math.max(
                1,
                Math.round(
                    this.baseDamage *
                    cast.skill
                        .damageMultiplier,
                ),
            );

        if (cast.objective) {
            DefenseObjectiveService
                .takeDamage(
                    cast.objective,
                    damage,
                );
        } else {
            BattleTargetRegistry
                .takeAreaDamage(
                    centerX,
                    centerY,
                    cast.skill.radius,
                    damage,
                );
        }

        this.createImpact(
            centerX,
            centerY,
            cast.skill.radius,
        );

        this.skillCooldown =
            cast.skill
                .cooldownSeconds;

        if (
            cast.skill.id ===
            'flame_breath' ||
            cast.skill.id ===
            'meteor_rain'
        ) {
            AudioManager.playSfx(
                'flame_dragon_roar',
                {
                    volume: 0.52,
                    minIntervalMs: 900,
                    throttleKey:
                        'flame_dragon_skill',
                },
            );
        }

        this.activeCast = null;
        this.destroyTelegraph();
    }

    private createVisual(): void {
        const glow =
            new Node('BossAura');

        glow.layer =
            Layers.Enum.UI_2D;

        this.bossNode.addChild(
            glow,
        );

        const aura =
            glow.addComponent(
                Graphics,
            );

        aura.fillColor =
            new Color(
                245,
                74,
                28,
                42,
            );
        aura.circle(0, -8, 78);
        aura.fill();

        const visual =
            new Node(
                'FlameDragonSprite',
            );

        visual.layer =
            Layers.Enum.UI_2D;

        this.bossNode.addChild(
            visual,
        );

        visual.setPosition(
            0,
            8,
            0,
        );

        visual.addComponent(
            UITransform,
        ).setContentSize(
            210,
            165,
        );

        const sprite =
            visual.addComponent(
                Sprite,
            );

        sprite.sizeMode =
            Sprite.SizeMode.CUSTOM;

        this.visualNode =
            visual;

        resources.load(
            this.definition
                .spriteFramePath,
            SpriteFrame,
            (
                error,
                frame,
            ) => {
                if (
                    error ||
                    !frame ||
                    !visual.isValid ||
                    !this.bossNode.isValid
                ) {
                    if (error) {
                        console.warn(
                            `[今晚守城] Boss 精灵加载失败：${this.definition.spriteFramePath}`,
                            error,
                        );
                    }
                    return;
                }

                sprite.spriteFrame =
                    frame;
            },
        );
    }

    private updateVisual(
        dt: number,
    ): void {
        if (
            !this.visualNode ||
            !this.visualNode.isValid
        ) {
            return;
        }

        this.visualTime += dt;

        const wingPulse =
            1 +
            Math.sin(
                this.visualTime *
                3.4,
            ) *
                0.018;

        this.visualNode.setScale(
            wingPulse,
            2 - wingPulse,
            1,
        );
    }

    private createTelegraph(
        x: number,
        y: number,
        skill:
            BossSkillDefinition,
    ): void {
        this.destroyTelegraph();

        const node =
            new Node(
                `BossTelegraph_${skill.id}`,
            );

        node.layer =
            Layers.Enum.UI_2D;

        BattleWorldService
            .ensure(this.canvas)
            .addChild(node);

        node.setPosition(
            x,
            y,
            0,
        );

        const g =
            node.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                239,
                54,
                26,
                58,
            );
        g.circle(
            0,
            0,
            skill.radius,
        );
        g.fill();

        g.strokeColor =
            new Color(
                255,
                185,
                52,
                235,
            );
        g.lineWidth = 6;
        g.circle(
            0,
            0,
            skill.radius,
        );
        g.stroke();

        g.lineWidth = 3;
        g.circle(
            0,
            0,
            skill.radius *
                0.42,
        );
        g.stroke();

        this.telegraph = node;
    }

    private createImpact(
        x: number,
        y: number,
        radius: number,
    ): void {
        const node =
            new Node(
                'BossSkillImpact',
            );

        node.layer =
            Layers.Enum.UI_2D;

        BattleWorldService
            .ensure(this.canvas)
            .addChild(node);

        node.setPosition(x, y, 0);

        const g =
            node.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                255,
                91,
                24,
                145,
            );
        g.circle(0, 0, radius);
        g.fill();

        g.strokeColor =
            new Color(
                255,
                222,
                91,
                255,
            );
        g.lineWidth = 10;
        g.circle(0, 0, radius * 0.72);
        g.stroke();

        this.effects.push(
            {
                node,
                remaining: 0.34,
                duration: 0.34,
            },
        );
    }

    private createSpawnBurst(): void {
        this.createImpact(
            this.bossNode.position.x,
            this.bossNode.position.y,
            116,
        );
    }

    private createPhaseBurst(): void {
        this.createImpact(
            this.bossNode.position.x,
            this.bossNode.position.y,
            98 +
                this.phaseIndex *
                24,
        );
    }

    private updateEffects(
        dt: number,
    ): void {
        for (
            let i =
                this.effects.length - 1;
            i >= 0;
            i -= 1
        ) {
            const effect =
                this.effects[i];

            effect.remaining -= dt;

            if (
                effect.remaining <= 0 ||
                !effect.node.isValid
            ) {
                if (effect.node.isValid) {
                    effect.node.destroy();
                }

                this.effects.splice(i, 1);
                continue;
            }

            const progress =
                1 -
                effect.remaining /
                    effect.duration;

            effect.node.setScale(
                0.78 +
                    progress *
                    0.4,
                0.78 +
                    progress *
                    0.4,
                1,
            );
        }
    }

    private destroyTelegraph(): void {
        if (
            this.telegraph &&
            this.telegraph.isValid
        ) {
            this.telegraph.destroy();
        }

        this.telegraph = null;
    }
}
