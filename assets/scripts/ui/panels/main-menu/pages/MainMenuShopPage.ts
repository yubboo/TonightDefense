import {
    Color,
    Graphics,
    Node,
} from 'cc';

import { MainMenuIcons } from '../widgets/MainMenuIcons';
import { MainMenuTheme } from '../widgets/MainMenuTheme';
import { MainMenuUIFactory } from '../widgets/MainMenuUIFactory';
import { MainMenuArt } from '../widgets/MainMenuArt';

import {
    MainMenuActionResult,
    MainMenuMetaState,
} from '../MainMenuModels';

export interface MainMenuShopPageOptions {
    parent:
        Node;

    metaState:
        MainMenuMetaState;

    onBuyStamina:
        () =>
            MainMenuActionResult;
}

export class MainMenuShopPage {
    private readonly root: Node;

    constructor(
        private readonly options:
            MainMenuShopPageOptions,
    ) {
        this.root = MainMenuUIFactory.node(
            options.parent,
            'ShopPage',
            720,
            1000,
            0,
            0,
        );

        this.build();
    }

    destroy(): void {
        if (this.root.isValid) {
            this.root.destroy();
        }
    }

    private build(): void {
        const panel = MainMenuUIFactory.paperCard(
            this.root,
            'ShopPanel',
            700,
            970,
            0,
            0,
        );
        MainMenuArt.attach(panel, 'panel-stage-blank', 714, 986, 'stretch');

        const title = MainMenuUIFactory.darkButton(
            panel,
            'TitleBar',
            660,
            72,
            0,
            432,
        );

        MainMenuIcons.create(
            title,
            'Icon',
            'shop',
            -258,
            0,
            46,
            MainMenuTheme.white,
        );

        MainMenuUIFactory.label(
            title,
            'Title',
            '商店',
            -158,
            0,
            30,
            140,
            MainMenuTheme.white,
        );

        const categories = [
            '推荐',
            '礼包',
            '材料',
            '外观',
            '每日',
        ];

        categories.forEach((text, index) => {
            const tab = MainMenuUIFactory.roundedBox(
                panel,
                `Category_${index}`,
                118,
                58,
                -260,
                322 - index * 68,
                index === 0
                    ? new Color(255, 206, 80, 255)
                    : new Color(65, 70, 67, 255),
                MainMenuTheme.ink,
                4,
                3,
            );

            MainMenuUIFactory.label(
                tab,
                'Label',
                text,
                0,
                0,
                17,
                90,
                index === 0
                    ? MainMenuTheme.ink
                    : MainMenuTheme.white,
            );
        });

        const banner = MainMenuUIFactory.roundedBox(
            panel,
            'RecommendBanner',
            455,
            150,
            92,
            292,
            new Color(207, 117, 138, 255),
            MainMenuTheme.ink,
            5,
            4,
        );

        MainMenuIcons.create(
            banner,
            'Stamina',
            'stamina',
            -145,
            8,
            62,
            MainMenuTheme.white,
        );

        MainMenuUIFactory.label(
            banner,
            'Title',
            '体力补给',
            55,
            29,
            28,
            220,
            MainMenuTheme.white,
        );

        MainMenuUIFactory.label(
            banner,
            'Desc',
            `每次 +${this.options.metaState.staminaPurchaseReward} 体力 · 今日 ${this.options.metaState.staminaPurchaseCount}/${this.options.metaState.staminaPurchaseLimit}`,
            55,
            -7,
            14,
            240,
            new Color(255, 238, 226, 255),
        );

        const buyButton =
            MainMenuUIFactory.yellowButton(
                banner,
                'BuyStamina',
                162,
                40,
                92,
                -43,
            );

        MainMenuUIFactory.label(
            banner,
            'CoinBalance',
            `当前金币：${this.options.metaState.coins}`,
            -8,
            -42,
            12,
            150,
            new Color(255, 245, 217, 255),
        );

        const nextCost =
            this.options
                .metaState
                .nextStaminaPurchaseCost;

        MainMenuUIFactory.label(
            buyButton,
            'Text',
            nextCost === null
                ? '今日已购满'
                : `${nextCost} 金币购买`,
            0,
            0,
            14,
            140,
            MainMenuTheme.ink,
        );

        if (nextCost !== null) {
            MainMenuUIFactory.bindPress(
                buyButton,
                () => {
                    this.options
                        .onBuyStamina();
                },
            );
        }

        const goods = [
            {
                name: '晶石材料',
                color: MainMenuTheme.blue,
            },
            {
                name: '金币材料',
                color: MainMenuTheme.gold,
            },
            {
                name: '养成材料',
                color: MainMenuTheme.green,
            },
        ];

        goods.forEach((item, index) => {
            const card = MainMenuUIFactory.roundedBox(
                panel,
                `Goods_${index}`,
                132,
                220,
                -62 + index * 154,
                55,
                MainMenuTheme.cream,
                MainMenuTheme.ink,
                5,
                3,
            );

            const icon = MainMenuUIFactory.roundedBox(
                card,
                'IconBox',
                96,
                104,
                0,
                40,
                new Color(
                    item.color.r,
                    item.color.g,
                    item.color.b,
                    130,
                ),
                new Color(160, 151, 133, 180),
                7,
                2,
            );

            const ig = icon.getComponent(Graphics)!;
            ig.fillColor = item.color;
            ig.circle(0, 0, 28);
            ig.fill();
            MainMenuArt.attach(icon,
                index === 0 ? 'icon-diamond-blue' : index === 1 ? 'icon-coin' : 'icon-warehouse',
                76, 76);

            MainMenuUIFactory.label(
                card,
                'Name',
                item.name,
                0,
                -35,
                16,
                110,
            );

            const button = MainMenuUIFactory.yellowButton(
                card,
                'Button',
                108,
                42,
                0,
                -78,
            );

            MainMenuUIFactory.label(
                button,
                'Text',
                '敬请期待',
                0,
                0,
                14,
                80,
            );
        });

        MainMenuUIFactory.label(
            panel,
            'Notice',
            '体力购买每日最多5次：100 / 200 / 300 / 400 / 500金币；其余商店内容后续开放。',
            82,
            -338,
            14,
            445,
            MainMenuTheme.inkSoft,
        );
    }
}
