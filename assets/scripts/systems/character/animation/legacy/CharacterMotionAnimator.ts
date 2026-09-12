/**
 * @architecture TonightDefense V1.0
 * @owner character
 * @module animation
 * @migratedFrom character/CharacterMotionAnimator.ts
 */
import {
    _decorator,
    Component,
    Vec3,
} from 'cc';

const { ccclass, property } = _decorator;

export type CharacterMotionState =
    | 'idle'
    | 'walk'
    | 'attack';

/**
 * 《今晚守城》
 * 角色动作过渡控制器 V0.1
 *
 * 这是“正式骨骼动画之前”的动作底座：
 * - idle：呼吸、轻微起伏、轻摆
 * - walk：走路上下起伏、左右重心摆动、轻微压缩回弹
 * - attack：抬手/蓄力/释放感的整体过渡
 * - 状态之间不是硬切，会平滑过渡
 *
 * 重要：
 * 目前 mage_down / left / up 是整张 PNG，
 * 所以这版能解决“整个人僵硬地滑行”和“动作硬切”，
 * 但不能真正让左右手、左右腿独立摆动。
 *
 * 真正的独立四肢动作需要：
 * 角色拆件 + Spine 骨骼绑定。
 */
@ccclass('CharacterMotionAnimator')
export class CharacterMotionAnimator extends Component {
    @property
    idleBob = 1.8;

    @property
    walkBob = 4.0;

    @property
    walkSwayDegrees = 2.2;

    @property
    transitionSpeed = 11;

    private state: CharacterMotionState = 'idle';

    private clock = 0;
    private attackClock = 0;
    private attackDuration = 0.34;

    private readonly basePosition = new Vec3();
    private readonly currentOffset = new Vec3();

    private currentRotationZ = 0;
    private currentScaleX = 1;
    private currentScaleY = 1;

    start(): void {
        this.basePosition.set(
            this.node.position.x,
            this.node.position.y,
            this.node.position.z,
        );
    }

    setMoving(
        moving: boolean,
    ): void {
        if (this.state === 'attack') {
            return;
        }

        this.state =
            moving
                ? 'walk'
                : 'idle';
    }

    playAttack(
        duration = 0.34,
    ): void {
        this.state = 'attack';
        this.attackClock = 0;
        this.attackDuration =
            Math.max(
                0.18,
                duration,
            );
    }

    update(dt: number): void {
        this.clock += dt;

        if (this.state === 'attack') {
            this.attackClock += dt;

            if (
                this.attackClock >=
                this.attackDuration
            ) {
                this.state = 'idle';
                this.attackClock = 0;
            }
        }

        let targetY = 0;
        let targetRotationZ = 0;
        let targetScaleX = 1;
        let targetScaleY = 1;

        if (this.state === 'idle') {
            const breath =
                Math.sin(
                    this.clock * 2.3,
                );

            const sway =
                Math.sin(
                    this.clock * 1.35,
                );

            targetY =
                breath *
                this.idleBob;

            targetRotationZ =
                sway * 0.8;

            targetScaleX =
                1 -
                breath * 0.006;

            targetScaleY =
                1 +
                breath * 0.012;
        } else if (
            this.state === 'walk'
        ) {
            const step =
                Math.sin(
                    this.clock * 10.5,
                );

            const stepAbs =
                Math.abs(step);

            const sway =
                Math.sin(
                    this.clock * 5.25,
                );

            targetY =
                stepAbs *
                this.walkBob;

            targetRotationZ =
                sway *
                this.walkSwayDegrees;

            targetScaleX =
                1 +
                stepAbs * 0.018;

            targetScaleY =
                1 -
                stepAbs * 0.025;
        } else {
            // attack：
            // 0~35% 蓄力后仰
            // 35~62% 向前释放
            // 62~100% 回收
            const t =
                Math.min(
                    1,
                    this.attackClock /
                        this.attackDuration,
                );

            if (t < 0.35) {
                const p =
                    t / 0.35;

                targetY =
                    p * 2.5;

                targetRotationZ =
                    -4.5 * p;

                targetScaleX =
                    1 - 0.035 * p;

                targetScaleY =
                    1 + 0.045 * p;
            } else if (
                t < 0.62
            ) {
                const p =
                    (t - 0.35) /
                    0.27;

                targetY =
                    2.5 -
                    p * 5.5;

                targetRotationZ =
                    -4.5 +
                    p * 10.0;

                targetScaleX =
                    0.965 +
                    p * 0.075;

                targetScaleY =
                    1.045 -
                    p * 0.09;
            } else {
                const p =
                    (t - 0.62) /
                    0.38;

                targetY =
                    -3.0 *
                    (1 - p);

                targetRotationZ =
                    5.5 *
                    (1 - p);

                targetScaleX =
                    1.04 -
                    0.04 * p;

                targetScaleY =
                    0.955 +
                    0.045 * p;
            }
        }

        const blend =
            Math.min(
                1,
                dt *
                    this.transitionSpeed,
            );

        this.currentOffset.y =
            this.lerp(
                this.currentOffset.y,
                targetY,
                blend,
            );

        this.currentRotationZ =
            this.lerp(
                this.currentRotationZ,
                targetRotationZ,
                blend,
            );

        this.currentScaleX =
            this.lerp(
                this.currentScaleX,
                targetScaleX,
                blend,
            );

        this.currentScaleY =
            this.lerp(
                this.currentScaleY,
                targetScaleY,
                blend,
            );

        this.node.setPosition(
            this.basePosition.x,
            this.basePosition.y +
                this.currentOffset.y,
            this.basePosition.z,
        );

        this.node.setRotationFromEuler(
            0,
            0,
            this.currentRotationZ,
        );

        this.node.setScale(
            this.currentScaleX,
            this.currentScaleY,
            1,
        );
    }

    private lerp(
        from: number,
        to: number,
        t: number,
    ): number {
        return (
            from +
            (to - from) * t
        );
    }
}
