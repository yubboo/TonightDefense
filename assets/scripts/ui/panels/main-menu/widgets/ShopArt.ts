import {
    isValid,
    Layers,
    Node,
    resources,
    Sprite,
    SpriteFrame,
    UITransform,
} from 'cc';

export const ShopArtPaths = {
    headerBg:
        'ui/shop/chrome/shop_header_bg',
    backNormal:
        'ui/shop/chrome/shop_back_normal',
    currencyStaminaBg:
        'ui/shop/chrome/shop_currency_stamina_bg',
    currencyCoinBg:
        'ui/shop/chrome/shop_currency_coin_bg',
    currencyGemBg:
        'ui/shop/chrome/shop_currency_gem_bg',

    priceCoin:
        'ui/shop/chrome/shop_price_coin',
    priceGem:
        'ui/shop/chrome/shop_price_gem',
    priceFree:
        'ui/shop/chrome/shop_price_free',
    divider:
        'ui/shop/chrome/shop_divider',

    cardNormal:
        'ui/shop/item-cards/shop_card_normal',
    cardDisabled:
        'ui/shop/item-cards/shop_card_disabled',

    categoryBundle:
        'ui/shop/icons/shop_item_bundle_chest',
    categoryMaterial:
        'ui/shop/icons/shop_item_upgrade_materials',
    categoryCosmetic:
        'ui/shop/icons/shop_item_skin_comingsoon',
    categoryDaily:
        'ui/shop/icons/shop_item_daily_supply',

    bannerFeaturedMain:
        'ui/shop/banners/shop_banner_featured_main',
    bannerStaminaSide:
        'ui/shop/banners/shop_banner_stamina_side',
    bannerHeroGrowth:
        'ui/shop/banners/shop_banner_hero_growth',
    bannerDailySupply:
        'ui/shop/banners/shop_banner_daily_supply',
    bannerMagicCrystal:
        'ui/shop/banners/shop_banner_magic_crystal',
    bannerUpgradeMaterials:
        'ui/shop/banners/shop_banner_upgrade_materials',
    bannerSkinComingSoon:
        'ui/shop/banners/shop_banner_skin_comingsoon',
} as const;

export type ShopArtKey =
    keyof typeof ShopArtPaths;

export type ShopArtFit =
    'contain' |
    'cover' |
    'stretch';

/**
 * ShopPage 正式 Sprite 资源加载器。
 *
 * 规则：
 * - 商店业务状态仍由 ShopService / CurrencyService / InventoryService 持有；
 * - 这里只负责把已经切好的 PNG 资源挂到节点；
 * - 资源丢失时节点本身仍存在，页面的 Graphics/Label 兜底不会被破坏。
 */
export class ShopArt {
    private static readonly cache =
        new Map<
            ShopArtKey,
            SpriteFrame
        >();

    private static preloadPromise:
        Promise<void> | null =
        null;

    static preloadRequired():
        Promise<void> {
        if (
            this.preloadPromise
        ) {
            return this.preloadPromise;
        }

        const keys =
            Object.keys(
                ShopArtPaths,
            ) as ShopArtKey[];

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
        key:
            ShopArtKey,
        width:
            number,
        height:
            number,
        x =
            0,
        y =
            0,
        fit:
            ShopArtFit =
            'contain',
        zIndex =
            0,
    ):
        Node {
        const node =
            new Node(
                `ShopArt_${key}`,
            );

        node.layer =
            Layers.Enum.UI_2D;

        if (
            zIndex <=
            0
        ) {
            parent.insertChild(
                node,
                0,
            );
        } else {
            parent.addChild(
                node,
            );
        }

        node.setPosition(
            x,
            y,
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

        const path =
            ShopArtPaths[
                key
            ];

        const cached =
            this.cache.get(
                key,
            ) ??
            resources.get(
                `${path}/spriteFrame`,
                SpriteFrame,
            );

        if (cached) {
            this.cache.set(
                key,
                cached,
            );

            this.applyFrame(
                transform,
                sprite,
                cached,
                width,
                height,
                fit,
            );

            return node;
        }

        resources.load(
            `${path}/spriteFrame`,
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
                    error ||
                    !frame
                ) {
                    if (
                        error
                    ) {
                        console.warn(
                            `[ShopArt] 无法加载 ${key}: ${path}`,
                            error,
                        );
                    }

                    return;
                }

                this.cache.set(
                    key,
                    frame,
                );

                this.applyFrame(
                    transform,
                    sprite,
                    frame,
                    width,
                    height,
                    fit,
                );
            },
        );

        return node;
    }

    private static loadIntoCache(
        key:
            ShopArtKey,
    ):
        Promise<void> {
        const path =
            ShopArtPaths[
                key
            ];

        const cached =
            resources.get(
                `${path}/spriteFrame`,
                SpriteFrame,
            );

        if (cached) {
            this.cache.set(
                key,
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
                            !error &&
                            frame
                        ) {
                            this.cache.set(
                                key,
                                frame,
                            );
                        }

                        resolve();
                    },
                );
            },
        );
    }

    private static applyFrame(
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
            ShopArtFit,
    ):
        void {
        sprite.spriteFrame =
            frame;

        if (
            fit ===
            'stretch'
        ) {
            transform.setContentSize(
                width,
                height,
            );
            return;
        }

        const rect =
            frame.rect;

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
}
