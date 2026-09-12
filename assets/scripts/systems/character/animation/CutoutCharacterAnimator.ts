/**
 * @architecture TonightDefense V1.0
 * @owner character
 * @module animation
 */
import {
    _decorator,
    Component,
    Node,
    Vec2,
} from 'cc';

import {
    MageCutoutFactory,
    MageCutoutRig,
} from '../visual/MageCutoutFactory';

import {
    MAGE_CUTOUT_POSE,
} from '../visual/MageCutoutPoseConfig';

import {
    MAGE_ANIMATION_TUNING,
} from './MageAnimationTuning';

const {
    ccclass,
    property,
} = _decorator;

@ccclass('CutoutCharacterAnimator')
export class CutoutCharacterAnimator
extends Component {
    @property
    animationSpeed = 1;

    private rig:
        MageCutoutRig | null =
        null;

    private clock = 0;

    private desiredMoving =
        false;

    private walkBlend = 0;

    private attackRemaining = 0;

    private attackDuration =
        MAGE_ANIMATION_TUNING
            .attack
            .defaultDuration;

    private hurtRemaining = 0;

    private hurtDuration =
        MAGE_ANIMATION_TUNING
            .hurt
            .defaultDuration;

    async setupMage():
        Promise<void> {
        this.rig =
            await MageCutoutFactory
                .build(
                    this.node,
                );

        this.clock = 0;
        this.walkBlend = 0;

        console.log(
            '[今晚守城] 元素法师拆件动画 V0.3',
        );
    }

    setMoving(
        moving: boolean,
    ): void {
        this.desiredMoving =
            moving;
    }

    setMoveDirection(
        direction: Vec2,
    ): void {
        this.setMoving(
            direction.lengthSqr() >
                0.01,
        );
    }

    playAttack(
        duration =
            MAGE_ANIMATION_TUNING
                .attack
                .defaultDuration,
    ): void {
        this.attackDuration =
            Math.max(
                MAGE_ANIMATION_TUNING
                    .attack
                    .minimumDuration,
                duration,
            );

        this.attackRemaining =
            this.attackDuration;
    }

    playHurt(
        duration =
            MAGE_ANIMATION_TUNING
                .hurt
                .defaultDuration,
    ): void {
        this.hurtDuration =
            Math.max(
                MAGE_ANIMATION_TUNING
                    .hurt
                    .minimumDuration,
                duration,
            );

        this.hurtRemaining =
            this.hurtDuration;
    }

    update(
        dt: number,
    ): void {
        if (!this.rig) {
            return;
        }

        const scaledDt =
            dt *
            this.animationSpeed;

        this.clock += scaledDt;

        this.updateWalkBlend(
            scaledDt,
        );

        if (
            this.attackRemaining > 0
        ) {
            this.attackRemaining =
                Math.max(
                    0,
                    this.attackRemaining -
                        scaledDt,
                );
        }

        if (
            this.hurtRemaining > 0
        ) {
            this.hurtRemaining =
                Math.max(
                    0,
                    this.hurtRemaining -
                        scaledDt,
                );
        }

        this.applyBasePose();

        /**
         * 攻击/受击时不再把基础动作硬切掉，
         * 而是保留 28% 基础动作，再叠加动作。
         */
        const actionActive =
            this.attackRemaining > 0 ||
            this.hurtRemaining > 0;

        const baseWeight =
            actionActive
                ? 0.28
                : 1;

        this.applyIdle(
            (
                1 -
                this.walkBlend
            ) *
                baseWeight,
        );

        this.applyWalk(
            this.walkBlend *
                baseWeight,
        );

        if (
            this.attackRemaining > 0
        ) {
            this.applyAttack();
        }

        if (
            this.hurtRemaining > 0
        ) {
            this.applyHurt();
        }
    }

    private updateWalkBlend(
        dt: number,
    ): void {
        const target =
            this.desiredMoving
                ? 1
                : 0;

        const speed =
            MAGE_ANIMATION_TUNING
                .locomotionBlendSpeed;

        const amount =
            1 -
            Math.exp(
                -speed * dt,
            );

        this.walkBlend =
            this.lerp(
                this.walkBlend,
                target,
                amount,
            );
    }

    private applyBasePose(): void {
        if (!this.rig) {
            return;
        }

        const rig = this.rig;
        const pose =
            MAGE_CUTOUT_POSE;

        rig.root.setPosition(
            0,
            pose.rootY,
            0,
        );

        rig.root.setScale(
            pose.modelScale,
            pose.modelScale,
            1,
        );

        this.setTransform(
            rig.body,
            pose.body,
        );

        this.setTransform(
            rig.hairBack,
            pose.hairBack,
        );

        this.setTransform(
            rig.capeBack,
            pose.capeBack,
        );

        this.setTransform(
            rig.legL,
            pose.legL,
        );

        this.setTransform(
            rig.legR,
            pose.legR,
        );

        this.setTransform(
            rig.belt,
            pose.belt,
        );

        this.setTransform(
            rig.capeLeft,
            pose.capeLeft,
        );

        this.setTransform(
            rig.capeRight,
            pose.capeRight,
        );

        this.setTransform(
            rig.armLUpper,
            pose.armLUpper,
        );

        this.setTransform(
            rig.armLLower,
            pose.armLLower,
        );

        this.setTransform(
            rig.armRUpper,
            pose.armRUpper,
        );

        this.setTransform(
            rig.armRLower,
            pose.armRLower,
        );

        this.setTransform(
            rig.staff,
            pose.staff,
        );

        this.setTransform(
            rig.staffOrb,
            pose.staffOrb,
        );

        this.setTransform(
            rig.head,
            pose.head,
        );

        this.setTransform(
            rig.hatBase,
            pose.hatBase,
        );

        this.setTransform(
            rig.hatTip,
            pose.hatTip,
        );

        rig.staffOrb.setScale(
            1,
            1,
            1,
        );
    }

    private applyIdle(
        weight: number,
    ): void {
        if (
            !this.rig ||
            weight <= 0.001
        ) {
            return;
        }

        const rig = this.rig;

        const tune =
            MAGE_ANIMATION_TUNING
                .idle;

        const breath =
            Math.sin(
                this.clock *
                    tune.breathSpeed,
            );

        const sway =
            Math.sin(
                this.clock *
                    tune.swaySpeed,
            );

        const delayed =
            Math.sin(
                this.clock *
                    tune.swaySpeed -
                    0.75,
            );

        this.addRootY(
            breath *
                tune.rootBob *
                weight,
        );

        this.addRotation(
            rig.body,
            sway *
                tune.bodySway *
                weight,
        );

        this.addRotation(
            rig.head,
            -sway *
                tune
                    .headCounterSway *
                weight,
        );

        this.addPositionY(
            rig.head,
            breath *
                tune.headBob *
                weight,
        );

        this.addRotation(
            rig.hatTip,
            delayed *
                tune.hatTipSway *
                weight,
        );

        this.addRotation(
            rig.capeLeft,
            delayed *
                tune.capeSway *
                weight,
        );

        this.addRotation(
            rig.capeRight,
            -delayed *
                tune.capeSway *
                weight,
        );

        this.addRotation(
            rig.armLUpper,
            sway *
                tune.armSway *
                weight,
        );

        this.addRotation(
            rig.armRUpper,
            -sway *
                tune.armSway *
                weight,
        );

        this.addRotation(
            rig.staff,
            -delayed *
                tune.staffSway *
                weight,
        );

        const pulse =
            1 +
            Math.sin(
                this.clock *
                    tune
                        .orbPulseSpeed -
                    0.35,
            ) *
                tune
                    .orbPulseAmount *
                weight;

        rig.staffOrb.setScale(
            pulse,
            pulse,
            1,
        );
    }

    private applyWalk(
        weight: number,
    ): void {
        if (
            !this.rig ||
            weight <= 0.001
        ) {
            return;
        }

        const rig = this.rig;

        const tune =
            MAGE_ANIMATION_TUNING
                .walk;

        const phase =
            this.clock *
            tune.stepSpeed;

        const step =
            Math.sin(phase);

        const delayed =
            Math.sin(
                phase - 0.7,
            );

        const bounce =
            Math.abs(
                Math.sin(phase),
            );

        this.addRootY(
            bounce *
                tune.rootBob *
                weight,
        );

        this.addRotation(
            rig.legL,
            step *
                tune.legSwing *
                weight,
        );

        this.addRotation(
            rig.legR,
            -step *
                tune.legSwing *
                weight,
        );

        this.addRotation(
            rig.armLUpper,
            -step *
                tune
                    .upperArmSwing *
                weight,
        );

        this.addRotation(
            rig.armLLower,
            -step *
                tune
                    .lowerArmSwing *
                weight,
        );

        this.addRotation(
            rig.armRUpper,
            step *
                tune
                    .upperArmSwing *
                0.82 *
                weight,
        );

        this.addRotation(
            rig.armRLower,
            step *
                tune
                    .lowerArmSwing *
                0.78 *
                weight,
        );

        this.addRotation(
            rig.body,
            -step *
                tune.bodySway *
                weight,
        );

        this.addRotation(
            rig.head,
            step *
                tune
                    .headCounterSway *
                weight,
        );

        this.addPositionY(
            rig.head,
            bounce *
                tune.headBob *
                weight,
        );

        this.addRotation(
            rig.hatTip,
            -delayed *
                tune.hatTipLag *
                weight,
        );

        this.addRotation(
            rig.capeLeft,
            -delayed *
                tune.capeLag *
                weight,
        );

        this.addRotation(
            rig.capeRight,
            delayed *
                tune.capeLag *
                weight,
        );

        this.addRotation(
            rig.staff,
            delayed *
                tune.staffLag *
                weight,
        );
    }

    private applyAttack(): void {
        if (!this.rig) {
            return;
        }

        const rig = this.rig;

        const tune =
            MAGE_ANIMATION_TUNING
                .attack;

        const t =
            this.clamp01(
                1 -
                this.attackRemaining /
                    this.attackDuration,
            );

        let reaction = 0;

        if (t < tune.chargeEnd) {
            const p =
                this.easeInOut(
                    t /
                        tune.chargeEnd,
                );

            this.addRotation(
                rig.body,
                tune.bodyCharge * p,
            );

            this.addRotation(
                rig.armRUpper,
                tune
                    .armUpperCharge *
                    p,
            );

            this.addRotation(
                rig.armRLower,
                tune
                    .armLowerCharge *
                    p,
            );

            this.addRotation(
                rig.staff,
                tune.staffCharge * p,
            );

            this.addPositionY(
                rig.staffOrb,
                tune.orbMoveY * p,
            );

            reaction = p;
        } else if (
            t <
            tune.releaseEnd
        ) {
            const p =
                this.easeInOut(
                    (
                        t -
                        tune.chargeEnd
                    ) /
                    (
                        tune.releaseEnd -
                        tune.chargeEnd
                    ),
                );

            this.addRotation(
                rig.body,
                this.lerp(
                    tune.bodyCharge,
                    tune.bodyRelease,
                    p,
                ),
            );

            this.addRotation(
                rig.armRUpper,
                this.lerp(
                    tune.armUpperCharge,
                    tune.armUpperRelease,
                    p,
                ),
            );

            this.addRotation(
                rig.armRLower,
                this.lerp(
                    tune.armLowerCharge,
                    tune.armLowerRelease,
                    p,
                ),
            );

            this.addRotation(
                rig.staff,
                this.lerp(
                    tune.staffCharge,
                    tune.staffRelease,
                    p,
                ),
            );

            this.addPositionX(
                rig.staffOrb,
                tune.orbMoveX * p,
            );

            reaction = 1;

            const scale =
                1 +
                tune.orbPulse *
                    Math.sin(
                        p *
                        Math.PI,
                    );

            rig.staffOrb.setScale(
                scale,
                scale,
                1,
            );
        } else {
            const p =
                this.easeInOut(
                    (
                        t -
                        tune.releaseEnd
                    ) /
                    (
                        1 -
                        tune.releaseEnd
                    ),
                );

            const back =
                1 - p;

            this.addRotation(
                rig.body,
                tune.bodyRelease *
                    back,
            );

            this.addRotation(
                rig.armRUpper,
                tune
                    .armUpperRelease *
                    back,
            );

            this.addRotation(
                rig.armRLower,
                tune
                    .armLowerRelease *
                    back,
            );

            this.addRotation(
                rig.staff,
                tune.staffRelease *
                    back,
            );

            reaction = back;
        }

        this.addRotation(
            rig.hatTip,
            tune.hatReaction *
                reaction,
        );

        this.addRotation(
            rig.capeLeft,
            -tune.capeReaction *
                reaction,
        );

        this.addRotation(
            rig.capeRight,
            tune.capeReaction *
                reaction,
        );
    }

    private applyHurt(): void {
        if (!this.rig) {
            return;
        }

        const rig = this.rig;

        const tune =
            MAGE_ANIMATION_TUNING
                .hurt;

        const t =
            this.clamp01(
                1 -
                this.hurtRemaining /
                    this.hurtDuration,
            );

        const kick =
            Math.sin(
                t *
                Math.PI,
            );

        const pos =
            rig.root.position;

        rig.root.setPosition(
            pos.x -
                kick *
                    tune.rootKickX,
            pos.y,
            pos.z,
        );

        this.addRotation(
            rig.body,
            kick *
                tune.bodyKick,
        );

        this.addRotation(
            rig.head,
            kick *
                tune.headKick,
        );

        this.addRotation(
            rig.hatTip,
            kick *
                tune.hatKick,
        );

        this.addRotation(
            rig.capeLeft,
            -kick *
                tune.capeKick,
        );

        this.addRotation(
            rig.capeRight,
            kick *
                tune.capeKick,
        );
    }

    private setTransform(
        node: Node,
        transform: {
            x: number;
            y: number;
            rotation: number;
        },
    ): void {
        node.setPosition(
            transform.x,
            transform.y,
            0,
        );

        node.setRotationFromEuler(
            0,
            0,
            transform.rotation,
        );
    }

    private addRootY(
        value: number,
    ): void {
        if (!this.rig) {
            return;
        }

        const p =
            this.rig
                .root
                .position;

        this.rig.root.setPosition(
            p.x,
            p.y + value,
            p.z,
        );
    }

    private addRotation(
        node: Node,
        delta: number,
    ): void {
        const euler =
            node.eulerAngles;

        node.setRotationFromEuler(
            0,
            0,
            euler.z +
                delta,
        );
    }

    private addPositionX(
        node: Node,
        value: number,
    ): void {
        const p =
            node.position;

        node.setPosition(
            p.x + value,
            p.y,
            p.z,
        );
    }

    private addPositionY(
        node: Node,
        value: number,
    ): void {
        const p =
            node.position;

        node.setPosition(
            p.x,
            p.y + value,
            p.z,
        );
    }

    private easeInOut(
        value: number,
    ): number {
        const t =
            this.clamp01(value);

        return (
            t *
            t *
            (
                3 -
                2 *
                t
            )
        );
    }

    private clamp01(
        value: number,
    ): number {
        return Math.max(
            0,
            Math.min(
                1,
                value,
            ),
        );
    }

    private lerp(
        from: number,
        to: number,
        t: number,
    ): number {
        return (
            from +
            (
                to -
                from
            ) *
                t
        );
    }
}
