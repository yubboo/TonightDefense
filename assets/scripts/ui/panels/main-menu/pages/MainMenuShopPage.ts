import {
    BlockInputEvents,
    Color,
    Graphics,
    Mask,
    Node,
    ScrollView,
    UITransform,
} from 'cc';

import {
    ShopCategoryId,
    ShopOfferSnapshot,
    ShopSnapshot,
    ShopVisualKey,
} from '../../../../systems/economy/shop/ShopTypes';

import {
    MainMenuActionResult,
    MainMenuMetaState,
} from '../MainMenuModels';

import {
    MainMenuIconKind,
    MainMenuIcons,
} from '../widgets/MainMenuIcons';

import {
    MainMenuTheme,
} from '../widgets/MainMenuTheme';

import {
    MainMenuUIFactory,
} from '../widgets/MainMenuUIFactory';

import {
    ShopArt,
    ShopArtKey,
} from '../widgets/ShopArt';

export interface MainMenuShopPageOptions {
    parent:
        Node;

    getMetaState:
        () =>
            MainMenuMetaState;

    getShopSnapshot:
        () =>
            ShopSnapshot;

    onBuyStamina:
        () =>
            MainMenuActionResult;

    onBuyOffer:
        (
            offerId:
                ShopOfferSnapshot['id'],
        ) =>
            MainMenuActionResult;

    onResult:
        (
            result:
                MainMenuActionResult,
        ) => void;

    onBack:
        () => void;
}

interface CategoryConfig {
    id:
        ShopCategoryId;

    label:
        string;

    icon:
        MainMenuIconKind;
}

/**
 * MainMenu 商店全屏页。
 *
 * v0.6.8：正式接入「方案 C」商店美术。
 *
 * 规则：
 * - 仍属于 MainMenu.scene Page，不新建 Shop.scene；
 * - ShopService / CurrencyService / InventoryService 继续拥有业务状态；
 * - 本类只负责布局、显示 Snapshot、发送购买意图；
 * - 生成式源图已经预切成独立 PNG，运行时不依赖 SpriteEditor 手工切图；
 * - 页面使用 ScrollView，长屏/短屏都可浏览完整商品列表。
 */
export class MainMenuShopPage {
    private readonly root:
        Node;

    private viewportHeight =
        1280;

    private selectedCategory:
        ShopCategoryId =
        'recommend';

    constructor(
        private readonly options:
            MainMenuShopPageOptions,
    ) {
        this.root =
            MainMenuUIFactory.node(
                options.parent,
                'ShopPage',
                720,
                1600,
                0,
                0,
            );

        this.root.addComponent(
            BlockInputEvents,
        );

        this.render();

        void ShopArt
            .preloadRequired()
            .then(
                () => {
                    if (
                        this.root.isValid
                    ) {
                        this.render();
                    }
                },
            );
    }

    setViewportHeight(
        viewportHeight:
            number,
    ):
        void {
        const next =
            Math.max(
                1280,
                Math.min(
                    1600,
                    viewportHeight,
                ),
            );

        if (
            Math.abs(
                next -
                this.viewportHeight,
            ) <
            0.5
        ) {
            return;
        }

        this.viewportHeight =
            next;

        this.root
            .getComponent(
                UITransform,
            )
            ?.setContentSize(
                720,
                next,
            );

        this.render();
    }

    destroy():
        void {
        if (
            this.root.isValid
        ) {
            this.root.destroy();
        }
    }

    private render():
        void {
        for (
            const child
            of [
                ...this.root.children,
            ]
        ) {
            child.destroy();
        }

        const half =
            this.viewportHeight /
            2;

        this.createFullscreenBackdrop();

        this.createHeader(
            half,
        );

        this.createScrollableBody(
            half,
        );
    }

    private createFullscreenBackdrop():
        void {
        /**
         * 专属背景精确结束在公共 MainMenuBottomNav 顶边。
         * 导航本体高 132；选中框可以继续向上凸出，但底边之间
         * 不留下会露出城堡背景的水平杂色缝。
         */
        const navSafeHeight =
            132;

        const backgroundHeight =
            this.viewportHeight -
            navSafeHeight;

        const background =
            MainMenuUIFactory.node(
                this.root,
                'ShopFullscreenBackground',
                720,
                backgroundHeight,
                0,
                navSafeHeight /
                    2,
            );

        const g =
            background.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                24,
                48,
                45,
                255,
            );

        g.rect(
            -360,
            -backgroundHeight /
                2,
            720,
            backgroundHeight,
        );
        g.fill();

        // 长屏下仅作为边缘兜底；正式内容由 ShopArt Sprite 覆盖。
        g.fillColor =
            new Color(
                15,
                32,
                31,
                255,
            );

        g.rect(
            -360,
            backgroundHeight /
                2 -
                110,
            720,
            110,
        );
        g.fill();
    }

    private createHeader(
        half:
            number,
    ):
        void {
        const meta =
            this.options
                .getMetaState();

        const header =
            MainMenuUIFactory.node(
                this.root,
                'ShopHeader',
                720,
                104,
                0,
                half -
                    53,
            );

        ShopArt.attach(
            header,
            'headerBg',
            720,
            104,
            0,
            0,
            'stretch',
        );

        const back =
            MainMenuUIFactory.node(
                header,
                'BackButton',
                104,
                54,
                -300,
                0,
            );

        ShopArt.attach(
            back,
            'backNormal',
            104,
            46,
            0,
            0,
            'contain',
        );

        MainMenuUIFactory.bindPress(
            back,
            () =>
                this.options
                    .onBack(),
        );

        MainMenuIcons.create(
            header,
            'ShopIcon',
            'shop',
            -210,
            0,
            44,
            MainMenuTheme.white,
        );

        MainMenuUIFactory.label(
            header,
            'Title',
            '王城商店',
            -118,
            2,
            28,
            170,
            MainMenuTheme.white,
        );

        this.createResourceBadge(
            header,
            'Stamina',
            'currencyStaminaBg',
            `${meta.stamina}`,
            84,
        );

        this.createResourceBadge(
            header,
            'Coin',
            'currencyCoinBg',
            `${meta.coins}`,
            192,
        );

        this.createResourceBadge(
            header,
            'Gem',
            'currencyGemBg',
            `${meta.gems}`,
            300,
        );
    }

    private createResourceBadge(
        parent:
            Node,
        name:
            string,
        art:
            ShopArtKey,
        value:
            string,
        x:
            number,
    ):
        void {
        const badge =
            MainMenuUIFactory.node(
                parent,
                `Resource_${name}`,
                100,
                46,
                x,
                0,
            );

        ShopArt.attach(
            badge,
            art,
            100,
            40,
            0,
            0,
            'contain',
        );

        MainMenuUIFactory.label(
            badge,
            'Value',
            value,
            18,
            0,
            18,
            54,
            MainMenuTheme.white,
        );
    }

    private createScrollableBody(
        half:
            number,
    ):
        void {
        const top =
            half -
            112;

        /**
         * MainMenuBottomNav 是五个大厅 Page 共用的常驻导航。
         * ScrollView 精确结束在 132 高的导航顶边，既不覆盖导航，
         * 也不在两者之间留下透明缝隙。
         */
        const bottom =
            -half +
            132;

        const viewHeight =
            top -
            bottom;

        const body =
            MainMenuUIFactory.node(
                this.root,
                'ShopScroll',
                704,
                viewHeight,
                0,
                (
                    top +
                    bottom
                ) /
                    2,
            );

        /**
         * 方案 C 的正文是一整张浅色羊皮纸，而不是把商品卡直接
         * 丢在深绿色背景上。v0.6.8 缺少这一层，所以标题发黑、
         * 卡片漂浮、商品少时底部出现大片“空洞”的深绿色。
         *
         * 这里把纸张放在 ScrollView 下面，内容滚动时背景保持稳定。
         */
        MainMenuUIFactory.roundedBox(
            body,
            'ShopPaperBackground',
            690,
            Math.max(
                200,
                viewHeight,
            ),
            0,
            0,
            new Color(
                247,
                241,
                218,
                255,
            ),
            new Color(
                185,
                151,
                83,
                255,
            ),
            18,
            2,
            false,
        );

        const view =
            MainMenuUIFactory.node(
                body,
                'View',
                704,
                viewHeight,
                0,
                0,
            );

        view.addComponent(
            Mask,
        );

        const offers =
            this.getVisibleOffers(
                this.options
                    .getShopSnapshot(),
            );

        const rows =
            this.selectedCategory ===
                'cosmetic'
                ? 1
                : Math.max(
                    1,
                    Math.ceil(
                        offers.length /
                        2,
                    ),
                );

        const naturalContentHeight =
            316 +
            86 +
            70 +
            (
                this.selectedCategory ===
                    'cosmetic'
                    ? 350
                    : rows *
                        372
            ) +
            104;

        const contentHeight =
            Math.max(
                viewHeight +
                    2,
                naturalContentHeight,
            );

        const content =
            MainMenuUIFactory.node(
                view,
                'Content',
                704,
                contentHeight,
                0,
                viewHeight /
                    2,
            );

        content
            .getComponent(
                UITransform,
            )
            ?.setAnchorPoint(
                0.5,
                1,
            );

        const scroll =
            body.addComponent(
                ScrollView,
            );

        scroll.horizontal =
            false;
        scroll.vertical =
            true;
        scroll.inertia =
            true;
        scroll.elastic =
            true;
        scroll.brake =
            0.78;
        scroll.content =
            content;

        this.createScrollableContent(
            content,
            offers,
            contentHeight,
        );
    }

    private createScrollableContent(
        content:
            Node,
        offers:
            ShopOfferSnapshot[],
        contentHeight:
            number,
    ):
        void {
        let cursorY =
            -20;

        this.createCategoryHero(
            content,
            cursorY -
                136,
        );

        cursorY -=
            296;

        this.createCategoryTabs(
            content,
            cursorY -
                35,
        );

        cursorY -=
            88;

        this.createSectionHeading(
            content,
            cursorY -
                26,
        );

        cursorY -=
            72;

        if (
            this.selectedCategory ===
            'cosmetic'
        ) {
            this.createCosmeticComingSoon(
                content,
                cursorY -
                    160,
            );

            this.createFooter(
                content,
                Math.min(
                    cursorY -
                        350,
                    -contentHeight +
                        48,
                ),
            );
            return;
        }

        if (
            offers.length <=
            0
        ) {
            this.createEmptyState(
                content,
                cursorY -
                    150,
            );

            this.createFooter(
                content,
                Math.min(
                    cursorY -
                        330,
                    -contentHeight +
                        48,
                ),
            );
            return;
        }

        const xs =
            [
                -166,
                166,
            ];

        offers.forEach(
            (
                offer,
                index,
            ) => {
                const row =
                    Math.floor(
                        index /
                        2,
                    );

                const column =
                    index %
                    2;

                /**
                 * 单数商品最后一张居中。
                 *
                 * v0.6.8 的礼包/推荐经常出现“左下孤零零一张，
                 * 右边空一整格”的未完成感；居中后更接近方案 C。
                 */
                const lastSingle =
                    offers.length %
                        2 ===
                        1 &&
                    index ===
                        offers.length -
                            1;

                this.createOfferCard(
                    content,
                    offer,
                    lastSingle
                        ? 0
                        : xs[column],
                    cursorY -
                        178 -
                        row *
                            372,
                );
            },
        );

        const rowCount =
            Math.ceil(
                offers.length /
                2,
            );

        this.createFooter(
            content,
            Math.min(
                cursorY -
                    rowCount *
                        372 -
                    28,
                -contentHeight +
                    48,
            ),
        );
    }

    private createFeaturedArea(
        parent:
            Node,
        y:
            number,
    ):
        void {
        const shop =
            this.options
                .getShopSnapshot();

        const featuredOffer =
            shop.offers.find(
                (
                    offer,
                ) =>
                    offer.id ===
                    'growth_bundle',
            ) ??
            shop.offers.find(
                (
                    offer,
                ) =>
                    offer.featured &&
                    offer.price.currency ===
                        'gem',
            );

        const left =
            MainMenuUIFactory.roundedBox(
                parent,
                'FeaturedMain',
                470,
                258,
                -108,
                y,
                new Color(
                    25,
                    44,
                    43,
                    255,
                ),
                MainMenuTheme.goldDeep,
                16,
                3,
                true,
            );

        this.createClippedArt(
            left,
            'FeaturedMainArtwork',
            'bannerFeaturedMain',
            456,
            244,
            0,
            0,
        );

        const shade =
            MainMenuUIFactory.node(
                left,
                'TextShade',
                228,
                232,
                -112,
                0,
            );

        const shadeGraphics =
            shade.addComponent(
                Graphics,
            );

        shadeGraphics.fillColor =
            new Color(
                12,
                27,
                35,
                190,
            );
        shadeGraphics.roundRect(
            -114,
            -116,
            228,
            232,
            12,
        );
        shadeGraphics.fill();

        MainMenuUIFactory.label(
            left,
            'Eyebrow',
            '超值推荐',
            -120,
            90,
            17,
            158,
            new Color(
                255,
                216,
                111,
                255,
            ),
        );

        MainMenuUIFactory.label(
            left,
            'Title',
            featuredOffer
                ?.name ??
                '英雄成长礼包',
            -102,
            49,
            28,
            198,
            MainMenuTheme.white,
            58,
        );

        MainMenuUIFactory.label(
            left,
            'Desc',
            featuredOffer
                ?.description ??
                '为英雄准备关键养成资源。',
            -98,
            -7,
            15,
            198,
            new Color(
                244,
                235,
                214,
                255,
            ),
            52,
        );

        if (featuredOffer) {
            this.createFeaturedBuyButton(
                left,
                featuredOffer,
                -102,
                -80,
            );
        }

        const meta =
            this.options
                .getMetaState();

        const stamina =
            MainMenuUIFactory.roundedBox(
                parent,
                'FeaturedStamina',
                196,
                258,
                237,
                y,
                new Color(
                    118,
                    51,
                    68,
                    255,
                ),
                MainMenuTheme.goldDeep,
                16,
                3,
                true,
            );

        this.createClippedArt(
            stamina,
            'FeaturedStaminaArtwork',
            'bannerStaminaSide',
            186,
            244,
            0,
            0,
        );

        MainMenuUIFactory.label(
            stamina,
            'Title',
            '体力补给',
            0,
            91,
            22,
            164,
            MainMenuTheme.white,
        );

        MainMenuUIFactory.label(
            stamina,
            'Desc',
            `恢复 ${meta.staminaPurchaseReward} 体力`,
            0,
            57,
            16,
            154,
            new Color(
                255,
                239,
                220,
                255,
            ),
        );

        this.createStaminaBuyButton(
            stamina,
            meta,
            0,
            -92,
        );
    }

    private createCategoryHero(
        parent:
            Node,
        y:
            number,
    ):
        void {
        if (
            this.selectedCategory ===
            'recommend'
        ) {
            this.createFeaturedArea(
                parent,
                y,
            );
            return;
        }

        const config:
            Readonly<{
                art:
                    ShopArtKey;
                title:
                    string;
                description:
                    string;
            }> =
            this.selectedCategory ===
                'bundle'
                ? {
                    art: 'categoryBundle',
                    title: '超值礼包',
                    description: '组合资源 · 每日限购',
                }
                : this.selectedCategory ===
                    'material'
                    ? {
                        art: 'categoryMaterial',
                        title: '养成材料',
                        description: '强化、粉尘、铁锭与结晶',
                    }
                    : this.selectedCategory ===
                        'cosmetic'
                        ? {
                            art: 'categoryCosmetic',
                            title: '英雄外观',
                            description: '外观系统接入后开放',
                        }
                        : {
                            art: 'categoryDaily',
                            title: '每日补给',
                            description: '每天刷新 · 记得领取',
                        };

        const hero =
            MainMenuUIFactory.roundedBox(
                parent,
                `CategoryHero_${this.selectedCategory}`,
                666,
                258,
                0,
                y,
                new Color(
                    25,
                    44,
                    43,
                    255,
                ),
                MainMenuTheme.goldDeep,
                16,
                3,
                true,
            );

        ShopArt.attach(
            hero,
            config.art,
            366,
            224,
            132,
            8,
            'contain',
        );

        const copyShade =
            MainMenuUIFactory.node(
                hero,
                'CategoryHeroCopyShade',
                300,
                224,
                -166,
                0,
            );

        const shadeGraphics =
            copyShade.addComponent(
                Graphics,
            );

        shadeGraphics.fillColor =
            new Color(
                11,
                29,
                31,
                210,
            );
        shadeGraphics.roundRect(
            -150,
            -112,
            300,
            224,
            12,
        );
        shadeGraphics.fill();

        MainMenuUIFactory.label(
            copyShade,
            'Title',
            config.title,
            0,
            28,
            27,
            250,
            MainMenuTheme.white,
        );

        MainMenuUIFactory.label(
            copyShade,
            'Description',
            config.description,
            0,
            -22,
            17,
            248,
            new Color(
                244,
                235,
                214,
                255,
            ),
        );
    }

    private createFeaturedBuyButton(
        parent:
            Node,
        offer:
            ShopOfferSnapshot,
        x:
            number,
        y:
            number,
    ):
        void {
        if (
            offer.soldOut
        ) {
            const disabled =
                MainMenuUIFactory.darkButton(
                    parent,
                    'FeaturedBuyDisabled',
                    176,
                    42,
                    x,
                    y,
                );

            MainMenuUIFactory.label(
                disabled,
                'Text',
                '今日已售罄',
                0,
                0,
                16,
                140,
                MainMenuTheme.white,
            );
            return;
        }

        const button =
            MainMenuUIFactory.node(
                parent,
                'FeaturedBuy',
                176,
                42,
                x,
                y,
            );

        ShopArt.attach(
            button,
            offer.price.currency ===
                'coin'
                ? 'priceCoin'
                : 'priceGem',
            176,
            38,
            0,
            0,
            'stretch',
        );

        MainMenuUIFactory.label(
            button,
            'Text',
            `${offer.price.amount} ${offer.price.currency === 'coin' ? '金币' : '钻石'}`,
            14,
            0,
            16,
            125,
            MainMenuTheme.ink,
        );

        MainMenuUIFactory.bindPress(
            button,
            () => {
                const result =
                    this.options
                        .onBuyOffer(
                            offer.id,
                        );

                this.options
                    .onResult(
                        result,
                    );

                this.render();
            },
        );
    }

    private createStaminaBuyButton(
        parent:
            Node,
        meta:
            MainMenuMetaState,
        x:
            number,
        y:
            number,
    ):
        void {
        const nextCost =
            meta.nextStaminaPurchaseCost;

        if (
            nextCost ===
            null
        ) {
            const disabled =
                MainMenuUIFactory.darkButton(
                    parent,
                    'BuyStaminaDisabled',
                    164,
                    42,
                    x,
                    y,
                );

            MainMenuUIFactory.label(
                disabled,
                'Text',
                '今日已购满',
                0,
                0,
                16,
                130,
                MainMenuTheme.white,
            );
            return;
        }

        const button =
            MainMenuUIFactory.node(
                parent,
                'BuyStamina',
                164,
                42,
                x,
                y,
            );

        ShopArt.attach(
            button,
            'priceCoin',
            164,
            38,
            0,
            0,
            'stretch',
        );

        MainMenuUIFactory.label(
            button,
            'Text',
            `${nextCost} 金币`,
            14,
            0,
            16,
            112,
            MainMenuTheme.ink,
        );

        MainMenuUIFactory.bindPress(
            button,
            () => {
                const result =
                    this.options
                        .onBuyStamina();

                this.options
                    .onResult(
                        result,
                    );

                this.render();
            },
        );
    }

    private createCategoryTabs(
        parent:
            Node,
        y:
            number,
    ):
        void {
        const categories:
            readonly CategoryConfig[] = [
                {
                    id: 'recommend',
                    label: '推荐',
                    icon: 'activity',
                },
                {
                    id: 'bundle',
                    label: '礼包',
                    icon: 'warehouse',
                },
                {
                    id: 'material',
                    label: '材料',
                    icon: 'upgrade',
                },
                {
                    id: 'cosmetic',
                    label: '外观',
                    icon: 'hero',
                },
                {
                    id: 'daily',
                    label: '每日',
                    icon: 'stamina',
                },
            ];

        const xs =
            [
                -278,
                -139,
                0,
                139,
                278,
            ];

        categories.forEach(
            (
                category,
                index,
            ) => {
                const active =
                    category.id ===
                    this.selectedCategory;

                const tab =
                    MainMenuUIFactory.roundedBox(
                        parent,
                        `Category_${category.id}`,
                        128,
                        62,
                        xs[index],
                        y,
                        active
                            ? new Color(
                                255,
                                205,
                                76,
                                255,
                            )
                            : new Color(
                                36,
                                61,
                                57,
                                255,
                            ),
                        active
                            ? MainMenuTheme.goldDeep
                            : new Color(
                                87,
                                112,
                                104,
                                255,
                            ),
                        12,
                        active
                            ? 3
                            : 2,
                        true,
                    );

                MainMenuIcons.create(
                    tab,
                    'Icon',
                    category.icon,
                    -35,
                    0,
                    27,
                    active
                        ? MainMenuTheme.ink
                        : MainMenuTheme.white,
                );

                MainMenuUIFactory.label(
                    tab,
                    'Label',
                    category.label,
                    19,
                    0,
                    19,
                    68,
                    active
                        ? MainMenuTheme.ink
                        : MainMenuTheme.white,
                );

                MainMenuUIFactory.bindPress(
                    tab,
                    () => {
                        if (
                            this.selectedCategory ===
                            category.id
                        ) {
                            return;
                        }

                        this.selectedCategory =
                            category.id;

                        this.render();
                    },
                );
            },
        );
    }

    private createSectionHeading(
        parent:
            Node,
        y:
            number,
    ):
        void {
        MainMenuUIFactory.label(
            parent,
            'SectionTitle',
            this.getCategoryTitle(
                this.selectedCategory,
            ),
            -205,
            y,
            24,
            230,
            MainMenuTheme.ink,
        );

        MainMenuUIFactory.label(
            parent,
            'SectionHint',
            this.getCategoryHint(
                this.selectedCategory,
            ),
            160,
            y,
            15,
            300,
            MainMenuTheme.inkSoft,
        );

        ShopArt.attach(
            parent,
            'divider',
            300,
            18,
            0,
            y -
                25,
            'contain',
        );
    }

    /**
     * `cover` 会按比例放大图片；若直接把 Sprite 挂到卡片上，
     * 放大后的真实节点尺寸会越过目标区域并串到相邻卡片。
     * 统一通过矩形 Mask 裁进设计稿预留的图片窗口。
     */
    private createClippedArt(
        parent:
            Node,
        name:
            string,
        art:
            ShopArtKey,
        width:
            number,
        height:
            number,
        x:
            number,
        y:
            number,
    ):
        Node {
        const viewport =
            MainMenuUIFactory.node(
                parent,
                name,
                width,
                height,
                x,
                y,
            );

        viewport.addComponent(
            Mask,
        );

        ShopArt.attach(
            viewport,
            art,
            width,
            height,
            0,
            0,
            'cover',
        );

        return viewport;
    }

    private createOfferCard(
        parent:
            Node,
        offer:
            ShopOfferSnapshot,
        x:
            number,
        y:
            number,
    ):
        void {
        const card =
            MainMenuUIFactory.node(
                parent,
                `Offer_${offer.id}`,
                322,
                356,
                x,
                y,
            );

        ShopArt.attach(
            card,
            offer.soldOut
                ? 'cardDisabled'
                : 'cardNormal',
            322,
            356,
            0,
            0,
            'stretch',
        );

        this.createClippedArt(
            card,
            'ArtworkViewport',
            this.mapOfferBanner(
                offer.visual,
            ),
            294,
            104,
            0,
            110,
        );

        MainMenuUIFactory.label(
            card,
            'Name',
            offer.name,
            0,
            38,
            22,
            276,
            MainMenuTheme.ink,
            32,
        );

        MainMenuUIFactory.label(
            card,
            'Desc',
            offer.description,
            0,
            2,
            16,
            282,
            MainMenuTheme.inkSoft,
            30,
        );

        const rewardLabels =
            offer.rewards
                .map(
                    (
                        reward,
                    ) =>
                        `${reward.name}×${reward.amount}`,
                );

        const rewardText =
            rewardLabels.length >
                2
                ? `${rewardLabels
                    .slice(
                        0,
                        2,
                    )
                    .join(' · ')}\n${rewardLabels
                    .slice(
                        2,
                    )
                    .join(' · ')}`
                : rewardLabels
                    .join(' · ');

        MainMenuUIFactory.label(
            card,
            'Rewards',
            rewardText,
            0,
            -42,
            15,
            282,
            MainMenuTheme.ink,
            38,
        );

        MainMenuUIFactory.label(
            card,
            'Limit',
            `今日剩余 ${offer.remainingToday}/${offer.dailyLimit}`,
            0,
            -83,
            14,
            250,
            offer.soldOut
                ? MainMenuTheme.red
                : MainMenuTheme.inkSoft,
            28,
        );

        this.createOfferBuyButton(
            card,
            offer,
            0,
            -140,
        );
    }

    private createOfferBuyButton(
        parent:
            Node,
        offer:
            ShopOfferSnapshot,
        x:
            number,
        y:
            number,
    ):
        void {
        /**
         * Cocos 系统字体与货币图标的可见内容都略低于节点几何中心。
         * 统一做 6 px 光学上移，保证四种卡片按钮状态视觉一致。
         */
        const contentY =
            6;

        if (
            offer.soldOut
        ) {
            const disabled =
                MainMenuUIFactory.node(
                    parent,
                    'BuyDisabled',
                    252,
                    42,
                    x,
                    y,
                );

            MainMenuUIFactory.label(
                disabled,
                'Text',
                '今日已售罄',
                0,
                contentY,
                16,
                160,
                MainMenuTheme.white,
            );
            return;
        }

        const free =
            offer.price.amount <=
            0;

        const button =
            MainMenuUIFactory.node(
                parent,
                'Buy',
                252,
                42,
                x,
                y,
            );

        if (free) {
            MainMenuUIFactory.label(
                button,
                'Text',
                '免费领取',
                0,
                contentY,
                17,
                190,
                MainMenuTheme.ink,
            );
        } else {
            /**
             * 图标与价格文字作为一个固定宽度视觉组居中。
             * 旧坐标 -72 / +16 让组合整体偏左，数值位数变化时
             * 尤其明显；这里收紧文字框并把两者共同移回中心。
             */
            MainMenuIcons.create(
                button,
                'CurrencyIcon',
                offer.price.currency ===
                    'coin'
                    ? 'coin'
                    : 'gem',
                -48,
                contentY,
                26,
                MainMenuTheme.white,
            );

            MainMenuUIFactory.label(
                button,
                'Text',
                `${offer.price.amount} ${offer.price.currency === 'coin' ? '金币' : '钻石'}`,
                26,
                contentY,
                16,
                100,
                MainMenuTheme.ink,
            );
        }

        MainMenuUIFactory.bindPress(
            button,
            () => {
                const result =
                    this.options
                        .onBuyOffer(
                            offer.id,
                        );

                this.options
                    .onResult(
                        result,
                    );

                this.render();
            },
        );
    }

    private createCosmeticComingSoon(
        parent:
            Node,
        y:
            number,
    ):
        void {
        const card =
            MainMenuUIFactory.roundedBox(
                parent,
                'CosmeticComingSoon',
                650,
                310,
                0,
                y,
                new Color(
                    223,
                    221,
                    211,
                    255,
                ),
                new Color(
                    143,
                    143,
                    138,
                    255,
                ),
                15,
                2,
                true,
            );

        this.createClippedArt(
            card,
            'CosmeticArtworkViewport',
            'bannerSkinComingSoon',
            618,
            188,
            0,
            52,
        );

        MainMenuUIFactory.label(
            card,
            'Title',
            '外观商店正在筹备',
            0,
            -68,
            22,
            420,
            MainMenuTheme.ink,
        );

        MainMenuUIFactory.label(
            card,
            'Desc',
            '英雄外观与城堡装饰将在外观数据层接入后开放。',
            0,
            -108,
            16,
            500,
            MainMenuTheme.inkSoft,
        );
    }

    private createEmptyState(
        parent:
            Node,
        y:
            number,
    ):
        void {
        const box =
            MainMenuUIFactory.roundedBox(
                parent,
                'EmptyState',
                610,
                240,
                0,
                y,
                new Color(
                    235,
                    229,
                    211,
                    255,
                ),
                new Color(
                    157,
                    146,
                    123,
                    220,
                ),
                16,
                2,
                true,
            );

        MainMenuIcons.create(
            box,
            'Icon',
            'warehouse',
            0,
            42,
            54,
            MainMenuTheme.inkSoft,
        );

        MainMenuUIFactory.label(
            box,
            'Title',
            '当前分类暂无商品',
            0,
            -22,
            21,
            330,
            MainMenuTheme.ink,
        );

        MainMenuUIFactory.label(
            box,
            'Desc',
            '后续只通过 ShopCatalog 增加商品，不在 UI 中复制交易逻辑。',
            0,
            -62,
            16,
            480,
            MainMenuTheme.inkSoft,
            48,
        );
    }

    private createFooter(
        parent:
            Node,
        y:
            number,
    ):
        void {
        ShopArt.attach(
            parent,
            'divider',
            430,
            26,
            0,
            y +
                22,
            'contain',
        );

        MainMenuUIFactory.label(
            parent,
            'FooterText',
            '守护王城 · 荣耀永存',
            0,
            y -
                2,
            15,
            320,
            new Color(
                129,
                105,
                58,
                255,
            ),
        );
    }

    private getVisibleOffers(
        snapshot:
            ShopSnapshot,
    ):
        ShopOfferSnapshot[] {
        if (
            this.selectedCategory ===
            'recommend'
        ) {
            return snapshot.offers
                .filter(
                    (
                        offer,
                    ) =>
                        offer.featured &&
                        offer.id !==
                            'growth_bundle',
                );
        }

        if (
            this.selectedCategory ===
            'cosmetic'
        ) {
            return [];
        }

        return snapshot.offers
            .filter(
                (
                    offer,
                ) =>
                    offer.category ===
                    this.selectedCategory,
            );
    }

    private getCategoryTitle(
        category:
            ShopCategoryId,
    ):
        string {
        switch (
            category
        ) {
            case 'bundle':
                return '超值礼包';
            case 'material':
                return '养成材料';
            case 'cosmetic':
                return '英雄外观';
            case 'daily':
                return '每日补给';
            case 'recommend':
            default:
                return '每日推荐';
        }
    }

    private getCategoryHint(
        category:
            ShopCategoryId,
    ):
        string {
        switch (
            category
        ) {
            case 'bundle':
                return '限购礼包 · 确定性购买';
            case 'material':
                return '英雄更强 · 王城更稳';
            case 'cosmetic':
                return '外观系统接入后开放';
            case 'daily':
                return '每日刷新购买次数';
            case 'recommend':
            default:
                return '不含随机抽取商品';
        }
    }

    private mapOfferBanner(
        visual:
            ShopVisualKey,
    ):
        ShopArtKey {
        switch (
            visual
        ) {
            case 'growth':
                return 'bannerHeroGrowth';
            case 'defense':
                return 'bannerUpgradeMaterials';
            case 'chest':
                return 'bannerHeroGrowth';
            case 'magic':
            case 'crystal':
                return 'bannerMagicCrystal';
            case 'iron':
            case 'stone':
                return 'bannerUpgradeMaterials';
            case 'supply':
            default:
                return 'bannerDailySupply';
        }
    }
}
