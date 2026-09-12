import {
    Graphics,
    isValid,
    Layers,
    Node,
    resources,
    Sprite,
    SpriteFrame,
    UITransform,
} from 'cc';

import {
    MainMenuArtKey,
    MainMenuArtPaths,
} from '../../../resources/UIResourceCatalog';

/**
 * 大厅正式 UI 美术加载器。
 *
 * 现在不再假设所有资源都在：
 * ui/main-menu/
 *
 * 每个资源的真实位置统一由 UIResourceCatalog 管理。
 */
export class MainMenuArt {
    private static readonly cache =
        new Map<
            MainMenuArtKey,
            SpriteFrame
        >();

    private static preloadPromise:
        Promise<void> | null =
        null;

    /**
     * 进入大厅前一次性预加载大厅所需正式 UI。
     *
     * 好处：
     * 1. 不会再出现旧 Graphics UI 先闪一下。
     * 2. 后续目录怎么分类，不影响页面代码。
     */
    static preloadRequired():
        Promise<void> {
        if (
            this.preloadPromise
        ) {
            return this.preloadPromise;
        }

        const keys =
            Object.keys(
                MainMenuArtPaths,
            ) as MainMenuArtKey[];

        this.preloadPromise =
            Promise.all(
                keys.map(
                    (
                        key,
                    ) =>
                        this.loadIntoCache(
                            key,
                        ),
                ),
            ).then(
                () =>
                    undefined,
            );

        return this.preloadPromise;
    }

    static attach(
        parent:
            Node,
        asset:
            MainMenuArtKey,
        width:
            number,
        height:
            number,
        fit:
            'contain' |
            'stretch' |
            'cover' =
            'contain',
        onReady?:
            () => void,
    ): Node {
        const node =
            new Node(
                `Art_${asset}`,
            );

        node.layer =
            Layers.Enum.UI_2D;

        parent.insertChild(
            node,
            0,
        );

        const transform =
            node.addComponent(
                UITransform,
            );

        transform.setContentSize(
            width,
            height,
        );

        const sprite =
            node.addComponent(
                Sprite,
            );

        sprite.sizeMode =
            Sprite.SizeMode.CUSTOM;

        sprite.trim =
            true;

        const cached =
            this.cache.get(
                asset,
            ) ??
            resources.get(
                `${MainMenuArtPaths[asset]}/spriteFrame`,
                SpriteFrame,
            );

        if (cached) {
            this.cache.set(
                asset,
                cached,
            );

            this.applyFrame(
                parent,
                transform,
                sprite,
                cached,
                width,
                height,
                fit,
                onReady,
            );

            return node;
        }

        /**
         * 保险分支。
         * 正常大厅流程已经预加载，所以通常不会走到这里。
         */
        resources.load(
            `${MainMenuArtPaths[asset]}/spriteFrame`,
            SpriteFrame,
            (
                error,
                frame,
            ) => {
                if (
                    !isValid(
                        node,
                        true,
                    ) ||
                    !isValid(
                        parent,
                        true,
                    )
                ) {
                    return;
                }

                if (
                    error ||
                    !frame
                ) {
                    console.warn(
                        `[MainMenuArt] 无法加载 ${asset}: ${MainMenuArtPaths[asset]}`,
                        error,
                    );

                    node.destroy();
                    return;
                }

                this.cache.set(
                    asset,
                    frame,
                );

                this.applyFrame(
                    parent,
                    transform,
                    sprite,
                    frame,
                    width,
                    height,
                    fit,
                    onReady,
                );
            },
        );

        return node;
    }

    private static loadIntoCache(
        asset:
            MainMenuArtKey,
    ): Promise<void> {
        const path =
            MainMenuArtPaths[
                asset
            ];

        const cached =
            resources.get(
                `${path}/spriteFrame`,
                SpriteFrame,
            );

        if (cached) {
            this.cache.set(
                asset,
                cached,
            );

            return Promise.resolve();
        }

        return new Promise<void>(
            (
                resolve,
            ) => {
                resources.load(
                    `${path}/spriteFrame`,
                    SpriteFrame,
                    (
                        error,
                        frame,
                    ) => {
                        if (
                            error ||
                            !frame
                        ) {
                            console.error(
                                `[MainMenuArt] 预加载失败：${asset} -> ${path}`,
                                error,
                            );

                            resolve();
                            return;
                        }

                        this.cache.set(
                            asset,
                            frame,
                        );

                        resolve();
                    },
                );
            },
        );
    }

    private static applyFrame(
        parent:
            Node,
        transform:
            UITransform,
        sprite:
            Sprite,
        frame:
            SpriteFrame,
        width:
            number,
        height:
            number,
        fit:
            'contain' |
            'stretch' |
            'cover',
        onReady?:
            () => void,
    ): void {
        sprite.spriteFrame =
            frame;

        const rect =
            frame.rect;

        if (
            fit !==
            'stretch'
        ) {
            const scale =
                fit ===
                'cover'
                    ? Math.max(
                        width /
                            rect.width,
                        height /
                            rect.height,
                    )
                    : Math.min(
                        width /
                            rect.width,
                        height /
                            rect.height,
                    );

            transform.setContentSize(
                rect.width *
                    scale,
                rect.height *
                    scale,
            );
        }

        /**
         * Graphics 现在只作为资源丢失时的安全兜底。
         * 正常情况下正式图片同一帧显示。
         */
        const fallback =
            parent.getComponent(
                Graphics,
            );

        if (fallback) {
            fallback.enabled =
                false;
        }

        onReady?.();
    }
}
