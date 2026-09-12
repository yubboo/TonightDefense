/**
 * @architecture TonightDefense V1.0
 * @owner character
 * @module visual
 * @migratedFrom character/CharacterSpriteController.ts
 */
import {
    _decorator,
    Component,
    resources,
    Sprite,
    SpriteFrame,
    UITransform,
    Vec2,
} from 'cc';

const { ccclass } = _decorator;

export type CharacterFacing =
    | 'down'
    | 'up'
    | 'left'
    | 'right';

/**
 * 《今晚守城》
 * 通用角色方向贴图控制器 V0.2
 *
 * 用途：
 * - 主角、伙伴都可以复用
 * - 本类只负责“角色视觉”
 * - 不负责移动、AI、攻击、数值
 *
 * 资源约定：
 * <basePath>/<prefix>_down.png
 * <basePath>/<prefix>_left.png
 * <basePath>/<prefix>_up.png
 *
 * 例如伙伴魔法师：
 * characters/companions/mage/sprite/mage_down
 * characters/companions/mage/sprite/mage_left
 * characters/companions/mage/sprite/mage_up
 *
 * 右方向直接复用 left 并水平翻转。
 */
@ccclass('CharacterSpriteController')
export class CharacterSpriteController extends Component {
    private resourceBasePath = '';
    private assetPrefix = '';
    private displayHeight = 118;

    private sprite: Sprite | null = null;

    private downFrame: SpriteFrame | null = null;
    private leftFrame: SpriteFrame | null = null;
    private upFrame: SpriteFrame | null = null;

    private facing: CharacterFacing = 'down';
    private loading = false;
    private loaded = false;

    setup(
        resourceBasePath: string,
        assetPrefix: string,
        displayHeight = 118,
    ): void {
        this.resourceBasePath = resourceBasePath;
        this.assetPrefix = assetPrefix;
        this.displayHeight = displayHeight;

        this.ensureSprite();
        this.loadFrames();
    }

    setMoveDirection(
        direction: Vec2,
    ): void {
        if (
            Math.abs(direction.x) < 0.03 &&
            Math.abs(direction.y) < 0.03
        ) {
            return;
        }

        if (
            Math.abs(direction.x) >
            Math.abs(direction.y)
        ) {
            this.setFacing(
                direction.x < 0
                    ? 'left'
                    : 'right',
            );
        } else {
            this.setFacing(
                direction.y > 0
                    ? 'up'
                    : 'down',
            );
        }
    }

    setFacing(
        facing: CharacterFacing,
    ): void {
        if (this.facing === facing && this.loaded) {
            return;
        }

        this.facing = facing;
        this.refreshFacing();
    }

    private ensureSprite(): void {
        this.sprite =
            this.node.getComponent(Sprite) ??
            this.node.addComponent(Sprite);

        this.sprite.sizeMode =
            Sprite.SizeMode.CUSTOM;

        const transform =
            this.node.getComponent(UITransform) ??
            this.node.addComponent(UITransform);

        transform.setContentSize(
            96,
            this.displayHeight,
        );
    }

    private loadFrames(): void {
        if (
            this.loading ||
            this.loaded ||
            !this.resourceBasePath ||
            !this.assetPrefix
        ) {
            return;
        }

        this.loading = true;

        let completed = 0;

        const finishOne = () => {
            completed += 1;

            if (completed < 3) {
                return;
            }

            this.loading = false;
            this.loaded = true;
            this.refreshFacing();

            console.log(
                `[今晚守城] 角色贴图加载完成：${this.resourceBasePath}/${this.assetPrefix}`,
            );
        };

        this.loadFrame(
            `${this.resourceBasePath}/${this.assetPrefix}_down/spriteFrame`,
            (frame) => {
                this.downFrame = frame;
                finishOne();
            },
        );

        this.loadFrame(
            `${this.resourceBasePath}/${this.assetPrefix}_left/spriteFrame`,
            (frame) => {
                this.leftFrame = frame;
                finishOne();
            },
        );

        this.loadFrame(
            `${this.resourceBasePath}/${this.assetPrefix}_up/spriteFrame`,
            (frame) => {
                this.upFrame = frame;
                finishOne();
            },
        );
    }

    private loadFrame(
        path: string,
        callback: (
            frame: SpriteFrame | null,
        ) => void,
    ): void {
        resources.load(
            path,
            SpriteFrame,
            (error, frame) => {
                if (error) {
                    console.error(
                        `[今晚守城] 角色贴图加载失败：${path}`,
                        error,
                    );

                    callback(null);
                    return;
                }

                callback(frame);
            },
        );
    }

    private refreshFacing(): void {
        if (!this.sprite) {
            return;
        }

        let frame: SpriteFrame | null = null;
        let flipX = false;

        switch (this.facing) {
            case 'up':
                frame = this.upFrame;
                break;

            case 'left':
                frame = this.leftFrame;
                break;

            case 'right':
                frame = this.leftFrame;
                flipX = true;
                break;

            case 'down':
            default:
                frame = this.downFrame;
                break;
        }

        if (frame) {
            this.sprite.spriteFrame = frame;
        }

        this.node.setScale(
            flipX ? -1 : 1,
            1,
            1,
        );

        this.fitCurrentFrame();
    }

    private fitCurrentFrame(): void {
        const frame =
            this.sprite?.spriteFrame;

        const transform =
            this.node.getComponent(
                UITransform,
            );

        if (
            !frame ||
            !transform
        ) {
            return;
        }

        const rect = frame.rect;

        if (
            rect.width <= 0 ||
            rect.height <= 0
        ) {
            return;
        }

        const width =
            this.displayHeight *
            (rect.width / rect.height);

        transform.setContentSize(
            width,
            this.displayHeight,
        );
    }
}
