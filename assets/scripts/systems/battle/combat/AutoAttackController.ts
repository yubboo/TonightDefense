/**
 * @architecture TonightDefense V1.0
 * @owner battle
 * @module combat
 *
 * 主角攻击方式由 ProfessionSystem 决定。
 */
import {
    _decorator,
    Color,
    Component,
    Graphics,
    Layers,
    Node,
    UITransform,
    Vec2,
} from 'cc';

import {
    EnemyController,
} from '../enemy/EnemyController';

import {
    BattleWorldService,
} from '../view/BattleWorldService';

import {
    MainHeroController,
} from '../../hero/character/player/MainHeroController';

import {
    ProfessionAttackMode,
} from '../../hero/profession/definition/ProfessionTypes';

import {
    AudioManager,
} from '../../audio/AudioManager';

const {
    ccclass,
    property,
} = _decorator;

interface ProjectileState {
    node: Node;
    target: Node;
    damage: number;
    speed: number;
    mode:
        ProfessionAttackMode;
}

@ccclass('AutoAttackController')
export class AutoAttackController
extends Component {
    /**
     * 以下只作为旧场景兼容回退值。
     */
    @property
    attackRange = 430;

    @property
    attackInterval = 0.65;

    @property
    damage = 10;

    @property
    projectileSpeed = 520;

    private cooldown = 0;

    private readonly projectiles:
        ProjectileState[] = [];

    update(
        dt: number,
    ): void {
        this.cooldown -=
            dt;

        this.tryAttack();

        this.updateProjectiles(
            dt,
        );
    }

    private tryAttack(): void {
        if (
            this.cooldown > 0
        ) {
            return;
        }

        const hero =
            MainHeroController.instance;

        const heroNode =
            hero?.targetNode;

        const combatant =
            hero?.combatant;

        const profession =
            hero?.selectedProfession;

        if (
            !heroNode ||
            !combatant ||
            !combatant.isAlive
        ) {
            return;
        }

        const range =
            profession
                ?.attackRange ??
            this.attackRange;

        const enemy =
            EnemyController.instance
                ?.findNearestEnemy(
                    heroNode.position,
                    range,
                );

        if (!enemy) {
            return;
        }

        const mode =
            profession
                ?.attackMode ??
            'magic';

        hero?.playAttackAnimation();

        AudioManager.playSfx(
            'hero_attack',
            {
                volume: 0.72,
                minIntervalMs: 90,
                throttleKey: 'hero_attack',
            },
        );

        if (
            mode ===
            'melee'
        ) {
            EnemyController.instance
                ?.takeDamageToEnemy(
                    enemy.node,
                    combatant
                        .attackPower,
                );

            AudioManager.playSfx(
                'hit',
                {
                    volume: 0.75,
                    minIntervalMs: 75,
                    throttleKey: 'hero_hit',
                },
            );

            this.createMeleeEffect(
                enemy.node.position.x,
                enemy.node.position.y,
            );
        } else {
            this.fireProjectile(
                heroNode,
                enemy.node,
                combatant
                    .attackPower,
                profession
                    ?.projectileSpeed ??
                    this.projectileSpeed,
                mode,
            );
        }

        const baseInterval =
            profession
                ?.attackInterval ??
            this.attackInterval;

        this.cooldown =
            baseInterval /
            Math.max(
                0.1,
                combatant.attackSpeedMultiplier,
            );
    }

    private fireProjectile(
        hero:
            Node,
        target:
            Node,
        damage:
            number,
        speed:
            number,
        mode:
            ProfessionAttackMode,
    ): void {
        const canvas =
            this.node.parent;

        if (!canvas) {
            return;
        }

        const projectile =
            new Node(
                'HeroProjectile',
            );

        projectile.layer =
            Layers.Enum.UI_2D;

        BattleWorldService.ensure(canvas).addChild(
            projectile,
        );

        projectile.setPosition(
            hero.position.x +
                22,
            hero.position.y +
                23,
            0,
        );

        projectile.addComponent(
            UITransform,
        ).setContentSize(
            26,
            26,
        );

        const g =
            projectile.addComponent(
                Graphics,
            );

        const color =
            this.getModeColor(
                mode,
            );

        if (
            mode ===
            'ranged'
        ) {
            g.strokeColor =
                color;

            g.lineWidth = 4;

            g.moveTo(
                -9,
                0,
            );

            g.lineTo(
                9,
                0,
            );

            g.stroke();

            g.fillColor =
                color;

            g.moveTo(
                10,
                0,
            );

            g.lineTo(
                3,
                5,
            );

            g.lineTo(
                3,
                -5,
            );

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
                12,
            );

            g.fill();

            g.fillColor =
                color;

            g.circle(
                0,
                0,
                7,
            );

            g.fill();
        }

        this.projectiles.push(
            {
                node:
                    projectile,

                target,

                damage,

                speed,

                mode,
            },
        );
    }

    private updateProjectiles(
        dt:
            number,
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
                this.removeProjectile(
                    i,
                );

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

                AudioManager.playSfx(
                    'hit',
                    {
                        volume: 0.75,
                        minIntervalMs: 75,
                        throttleKey: 'hero_hit',
                    },
                );

                this.createHitEffect(
                    targetPos.x,
                    targetPos.y,
                    projectile.mode,
                );

                this.removeProjectile(
                    i,
                );

                continue;
            }

            const direction =
                new Vec2(
                    dx,
                    dy,
                );

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

    private createMeleeEffect(
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
                'HeroMeleeSlash',
            );

        hit.layer =
            Layers.Enum.UI_2D;

        BattleWorldService.ensure(canvas).addChild(
            hit,
        );

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
                245,
                219,
                116,
                240,
            );

        g.lineWidth = 6;

        g.moveTo(
            -17,
            15,
        );

        g.lineTo(
            17,
            -15,
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

    private createHitEffect(
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
                'HeroHit',
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
            this.getModeColor(
                mode,
            );

        g.lineWidth = 4;

        g.circle(
            0,
            0,
            16,
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

    private removeProjectile(
        index: number,
    ): void {
        const projectile =
            this.projectiles[index];

        if (
            projectile?.node
                ?.isValid
        ) {
            projectile.node.destroy();
        }

        this.projectiles.splice(
            index,
            1,
        );
    }

    private getModeColor(
        mode:
            ProfessionAttackMode,
    ): Color {
        switch (mode) {
            case 'ranged':
                return new Color(
                    232,
                    190,
                    77,
                    255,
                );

            case 'support':
                return new Color(
                    105,
                    221,
                    170,
                    255,
                );

            case 'magic':
                return new Color(
                    126,
                    202,
                    239,
                    255,
                );

            case 'melee':
            default:
                return new Color(
                    246,
                    220,
                    117,
                    255,
                );
        }
    }
}
