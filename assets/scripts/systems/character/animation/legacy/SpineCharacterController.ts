/**
 * @architecture TonightDefense V1.0
 * @owner character
 * @module animation
 * @migratedFrom character/SpineCharacterController.ts
 */
import {
    _decorator,
    Component,
    resources,
    sp,
    Vec2,
} from 'cc';

const { ccclass } = _decorator;

export type SpineCharacterState =
    | 'idle'
    | 'walk'
    | 'attack'
    | 'hurt'
    | 'death';

@ccclass('SpineCharacterController')
export class SpineCharacterController extends Component {
    private skeleton: sp.Skeleton | null = null;
    private resourcePath = '';
    private state: SpineCharacterState = 'idle';
    private facing: 'down' | 'up' | 'left' | 'right' = 'down';
    private loaded = false;

    setup(resourcePath: string): void {
        this.resourcePath = resourcePath;
        this.ensureSkeleton();
        this.loadSkeletonData();
    }

    setMoveDirection(direction: Vec2): void {
        if (
            Math.abs(direction.x) < 0.03 &&
            Math.abs(direction.y) < 0.03
        ) {
            this.setState('idle');
            return;
        }

        if (Math.abs(direction.x) > Math.abs(direction.y)) {
            this.facing = direction.x < 0 ? 'left' : 'right';
        } else {
            this.facing = direction.y > 0 ? 'up' : 'down';
        }

        this.setState('walk');
    }

    setIdle(): void {
        this.setState('idle');
    }

    playAttack(): void {
        this.playOneShot('attack', 'idle');
    }

    playHurt(): void {
        this.playOneShot('hurt', 'idle');
    }

    playDeath(): void {
        if (!this.loaded || !this.skeleton) {
            return;
        }

        this.state = 'death';
        this.applyFlip();

        this.skeleton.setAnimation(
            0,
            this.getAnimationName('death'),
            false,
        );
    }

    private ensureSkeleton(): void {
        this.skeleton =
            this.node.getComponent(sp.Skeleton) ??
            this.node.addComponent(sp.Skeleton);

        this.skeleton.premultipliedAlpha = false;
    }

    private loadSkeletonData(): void {
        if (!this.skeleton || !this.resourcePath) {
            return;
        }

        resources.load(
            this.resourcePath,
            sp.SkeletonData,
            (error, data) => {
                if (error) {
                    console.error(
                        `[今晚守城] Spine 加载失败：${this.resourcePath}`,
                        error,
                    );
                    return;
                }

                if (!this.skeleton) {
                    return;
                }

                this.skeleton.skeletonData = data;
                this.loaded = true;
                this.state = 'idle';
                this.applyFlip();

                this.skeleton.setAnimation(
                    0,
                    this.getAnimationName('idle'),
                    true,
                );

                console.log(
                    `[今晚守城] Spine 角色加载完成：${this.resourcePath}`,
                );
            },
        );
    }

    private setState(state: SpineCharacterState): void {
        if (!this.loaded || !this.skeleton || state === 'death') {
            return;
        }

        if (this.state === state) {
            this.applyFlip();
            return;
        }

        this.state = state;
        this.applyFlip();

        const loop =
            state === 'idle' ||
            state === 'walk';

        this.skeleton.setAnimation(
            0,
            this.getAnimationName(state),
            loop,
        );
    }

    private playOneShot(
        state: 'attack' | 'hurt',
        returnState: 'idle' | 'walk',
    ): void {
        if (!this.loaded || !this.skeleton) {
            return;
        }

        this.state = state;
        this.applyFlip();

        this.skeleton.setAnimation(
            0,
            this.getAnimationName(state),
            false,
        );

        this.skeleton.addAnimation(
            0,
            this.getAnimationName(returnState),
            true,
            0,
        );
    }

    private getAnimationName(
        state: SpineCharacterState,
    ): string {
        if (
            this.facing === 'left' ||
            this.facing === 'right'
        ) {
            return `${state}_side`;
        }

        return `${state}_${this.facing}`;
    }

    private applyFlip(): void {
        this.node.setScale(
            this.facing === 'right' ? -1 : 1,
            1,
            1,
        );
    }
}
