/**
 * @architecture TonightDefense V1.0
 * @owner character
 * @module visual
 *
 * 元素法师拆件工厂 V0.4
 *
 * 核心修复：
 * 1. 以前每 await 一张图就显示一个部件，所以角色会“一点点生成”。
 * 2. 现在先并行预加载全部 PNG。
 * 3. 全部资源到齐后一次性拼装。
 * 4. 根节点在完整拼好前保持隐藏。
 * 5. 最终尺寸在显示之前就设置好，不再“先大后突然变小”。
 */
import {
    Layers,
    Node,
    resources,
    Sprite,
    SpriteFrame,
    tween,
    UIOpacity,
    UITransform,
    Vec3,
} from 'cc';

import {
    MAGE_CUTOUT_POSE,
} from './MageCutoutPoseConfig';

export interface MageCutoutRig {
    root: Node;
    shadow: Node;

    capeBack: Node;
    capeLeft: Node;
    capeRight: Node;

    legL: Node;
    legR: Node;

    body: Node;
    belt: Node;

    armLUpper: Node;
    armLLower: Node;
    armRUpper: Node;
    armRLower: Node;

    hairBack: Node;
    head: Node;

    hatBase: Node;
    hatTip: Node;

    staff: Node;
    staffOrb: Node;
}

interface PartConfig {
    file: string;
    position: Vec3;
    anchorX: number;
    anchorY: number;
    rotation?: number;
    scale?: number;
}

export class MageCutoutFactory {
    private static readonly RESOURCE_BASE =
        'characters/companions/mage/cutout/down';

    private static readonly PART_SCALE =
        0.30;

    private static readonly FILES =
        [
            'shadow',
            'cape_back',
            'hair_back',
            'leg_l',
            'leg_r',
            'body',
            'belt',
            'cape_left',
            'cape_right',
            'arm_l_upper',
            'arm_l_lower',
            'arm_r_upper',
            'arm_r_lower',
            'staff',
            'staff_orb',
            'head',
            'hat_base',
            'hat_tip',
        ] as const;

    static async build(
        parent: Node,
    ): Promise<MageCutoutRig> {
        const pose =
            MAGE_CUTOUT_POSE;

        /**
         * 先把所有 SpriteFrame 一次并行读完。
         * 角色此时还没创建，不会出现部件逐个冒出来。
         */
        const frames =
            await this.preloadAllFrames();

        const root =
            new Node('MageCutoutRig');

        root.layer =
            Layers.Enum.UI_2D;

        /**
         * 拼好前先隐藏。
         */
        root.active = false;

        parent.addChild(root);

        root.addComponent(
            UITransform,
        ).setContentSize(
            120,
            145,
        );

        /**
         * 最终缩放在显示前就设置。
         * 不会再看到“先大后小”。
         */
        root.setScale(
            pose.modelScale,
            pose.modelScale,
            1,
        );

        const opacity =
            root.addComponent(
                UIOpacity,
            );

        opacity.opacity = 0;

        const shadow =
            this.createPart(
                root,
                frames,
                {
                    file: 'shadow',
                    position:
                        new Vec3(
                            0,
                            -55,
                            0,
                        ),
                    anchorX: 0.5,
                    anchorY: 0.5,
                    scale: 0.38,
                },
            );

        const capeBack =
            this.createPart(
                root,
                frames,
                {
                    file: 'cape_back',
                    position:
                        this.vec(
                            pose.capeBack,
                        ),
                    anchorX: 0.5,
                    anchorY: 0.80,
                    scale: 0.28,
                },
            );

        const hairBack =
            this.createPart(
                root,
                frames,
                {
                    file: 'hair_back',
                    position:
                        this.vec(
                            pose.hairBack,
                        ),
                    anchorX: 0.5,
                    anchorY: 0.62,
                    scale: 0.29,
                },
            );

        const legL =
            this.createPart(
                root,
                frames,
                {
                    file: 'leg_l',
                    position:
                        this.vec(
                            pose.legL,
                        ),
                    anchorX: 0.5,
                    anchorY: 0.90,
                    scale: 0.28,
                },
            );

        const legR =
            this.createPart(
                root,
                frames,
                {
                    file: 'leg_r',
                    position:
                        this.vec(
                            pose.legR,
                        ),
                    anchorX: 0.5,
                    anchorY: 0.90,
                    scale: 0.28,
                },
            );

        const body =
            this.createPart(
                root,
                frames,
                {
                    file: 'body',
                    position:
                        this.vec(
                            pose.body,
                        ),
                    anchorX: 0.5,
                    anchorY: 0.54,
                    scale: 0.29,
                },
            );

        const belt =
            this.createPart(
                body,
                frames,
                {
                    file: 'belt',
                    position:
                        this.vec(
                            pose.belt,
                        ),
                    anchorX: 0.5,
                    anchorY: 0.5,
                    scale: 0.245,
                },
            );

        const capeLeft =
            this.createPart(
                body,
                frames,
                {
                    file: 'cape_left',
                    position:
                        this.vec(
                            pose.capeLeft,
                        ),
                    anchorX: 0.72,
                    anchorY: 0.84,
                    scale: 0.255,
                },
            );

        const capeRight =
            this.createPart(
                body,
                frames,
                {
                    file: 'cape_right',
                    position:
                        this.vec(
                            pose.capeRight,
                        ),
                    anchorX: 0.28,
                    anchorY: 0.84,
                    scale: 0.255,
                },
            );

        const armLUpper =
            this.createPart(
                body,
                frames,
                {
                    file: 'arm_l_upper',
                    position:
                        this.vec(
                            pose.armLUpper,
                        ),
                    anchorX: 0.58,
                    anchorY: 0.89,
                    scale: 0.255,
                },
            );

        const armLLower =
            this.createPart(
                armLUpper,
                frames,
                {
                    file: 'arm_l_lower',
                    position:
                        this.vec(
                            pose.armLLower,
                        ),
                    anchorX: 0.54,
                    anchorY: 0.88,
                    scale: 0.255,
                },
            );

        const armRUpper =
            this.createPart(
                body,
                frames,
                {
                    file: 'arm_r_upper',
                    position:
                        this.vec(
                            pose.armRUpper,
                        ),
                    anchorX: 0.42,
                    anchorY: 0.89,
                    scale: 0.255,
                },
            );

        const armRLower =
            this.createPart(
                armRUpper,
                frames,
                {
                    file: 'arm_r_lower',
                    position:
                        this.vec(
                            pose.armRLower,
                        ),
                    anchorX: 0.46,
                    anchorY: 0.88,
                    scale: 0.255,
                },
            );

        const staff =
            this.createPart(
                armRLower,
                frames,
                {
                    file: 'staff',
                    position:
                        this.vec(
                            pose.staff,
                        ),
                    anchorX: 0.50,
                    anchorY: 0.12,
                    scale: 0.28,
                },
            );

        const staffOrb =
            this.createPart(
                staff,
                frames,
                {
                    file: 'staff_orb',
                    position:
                        this.vec(
                            pose.staffOrb,
                        ),
                    anchorX: 0.5,
                    anchorY: 0.5,
                    scale: 0.24,
                },
            );

        const head =
            this.createPart(
                body,
                frames,
                {
                    file: 'head',
                    position:
                        this.vec(
                            pose.head,
                        ),
                    anchorX: 0.5,
                    anchorY: 0.38,
                    scale: 0.29,
                },
            );

        const hatBase =
            this.createPart(
                head,
                frames,
                {
                    file: 'hat_base',
                    position:
                        this.vec(
                            pose.hatBase,
                        ),
                    anchorX: 0.5,
                    anchorY: 0.27,
                    scale: 0.285,
                },
            );

        const hatTip =
            this.createPart(
                hatBase,
                frames,
                {
                    file: 'hat_tip',
                    position:
                        this.vec(
                            pose.hatTip,
                        ),
                    anchorX: 0.46,
                    anchorY: 0.10,
                    scale: 0.275,
                },
            );

        /**
         * 全部拼装完成后再一次性显示。
         * 用非常短的淡入避免生硬跳出，但不会拖泥带水。
         */
        root.active = true;

        tween(opacity)
            .to(
                0.12,
                {
                    opacity: 255,
                },
                {
                    easing:
                        'sineOut',
                },
            )
            .start();

        return {
            root,
            shadow,
            capeBack,
            capeLeft,
            capeRight,
            legL,
            legR,
            body,
            belt,
            armLUpper,
            armLLower,
            armRUpper,
            armRLower,
            hairBack,
            head,
            hatBase,
            hatTip,
            staff,
            staffOrb,
        };
    }

    private static vec(
        value: {
            x: number;
            y: number;
            rotation: number;
        },
    ): Vec3 {
        return new Vec3(
            value.x,
            value.y,
            0,
        );
    }

    private static createPart(
        parent: Node,
        frames:
            ReadonlyMap<
                string,
                SpriteFrame | null
            >,
        config:
            PartConfig,
    ): Node {
        const node =
            new Node(
                `Part_${config.file}`,
            );

        node.layer =
            Layers.Enum.UI_2D;

        parent.addChild(node);

        node.setPosition(
            config.position,
        );

        node.setRotationFromEuler(
            0,
            0,
            config.rotation ?? 0,
        );

        const sprite =
            node.addComponent(
                Sprite,
            );

        sprite.sizeMode =
            Sprite.SizeMode.CUSTOM;

        /**
         * Sprite 在 Cocos 3.8 会自动确保节点拥有 UITransform。
         * 旧实现紧接着再次 addComponent(UITransform)，会在编辑器预览中触发
         * "already contains the same component"，并让异步拆件构建 Promise reject。
         * 这里统一复用已有组件，只在确实不存在时补建。
         */
        const transform =
            node.getComponent(
                UITransform,
            ) ??
            node.addComponent(
                UITransform,
            );

        transform.setAnchorPoint(
            config.anchorX,
            config.anchorY,
        );

        const frame =
            frames.get(
                config.file,
            ) ?? null;

        if (frame) {
            sprite.spriteFrame =
                frame;

            const partScale =
                config.scale ??
                this.PART_SCALE;

            transform.setContentSize(
                frame.originalSize.width *
                    partScale,
                frame.originalSize.height *
                    partScale,
            );
        }

        return node;
    }

    private static async preloadAllFrames():
        Promise<
            Map<
                string,
                SpriteFrame | null
            >
        > {
        const pairs =
            await Promise.all(
                this.FILES.map(
                    async (
                        file,
                    ) => {
                        const frame =
                            await this.loadFrame(
                                `${this.RESOURCE_BASE}/${file}/spriteFrame`,
                            );

                        return [
                            file,
                            frame,
                        ] as const;
                    },
                ),
            );

        return new Map(
            pairs,
        );
    }

    private static loadFrame(
        path: string,
    ):
        Promise<
            SpriteFrame | null
        > {
        return new Promise(
            (resolve) => {
                resources.load(
                    path,
                    SpriteFrame,
                    (
                        error,
                        frame,
                    ) => {
                        if (error) {
                            console.error(
                                `[今晚守城] 魔法师拆件加载失败：${path}`,
                                error,
                            );

                            resolve(null);
                            return;
                        }

                        resolve(frame);
                    },
                );
            },
        );
    }
}
