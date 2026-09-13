import {
    Color,
    Graphics,
    Node,
} from 'cc';

import {
    MainMenuMetaState,
} from '../MainMenuModels';
import {
    MainMenuIconKind,
    MainMenuIcons,
} from './MainMenuIcons';
import {
    MainMenuTheme,
} from './MainMenuTheme';
import {
    MainMenuUIFactory,
} from './MainMenuUIFactory';
import {
    ShopArt,
    ShopArtKey,
} from './ShopArt';

export interface MainMenuFullscreenShellOptions {
    title: string;
    icon: MainMenuIconKind;
    metaState: MainMenuMetaState;
}

export interface MainMenuFullscreenShellResult {
    body: Node;
    bodyHeight: number;
    topLocalY: number;
    bottomLocalY: number;
}

/**
 * 英雄 / 仓库 / 升级共用的全屏页面骨架。
 *
 * 只负责统一背景、Header、资源栏和与常驻底栏的衔接；
 * 页面内容与业务状态仍由各自 Page / Service 持有。
 */
export class MainMenuFullscreenShell {
    static readonly BOTTOM_NAV_HEIGHT = 132;

    static create(
        root: Node,
        viewportHeight: number,
        options: MainMenuFullscreenShellOptions,
    ): MainMenuFullscreenShellResult {
        const half = viewportHeight / 2;
        const backgroundHeight =
            viewportHeight - this.BOTTOM_NAV_HEIGHT;

        const background = MainMenuUIFactory.node(
            root,
            'FullscreenBackground',
            720,
            backgroundHeight,
            0,
            this.BOTTOM_NAV_HEIGHT / 2,
        );
        const graphics = background.addComponent(Graphics);
        graphics.fillColor = new Color(24, 48, 45, 255);
        graphics.rect(
            -360,
            -backgroundHeight / 2,
            720,
            backgroundHeight,
        );
        graphics.fill();

        this.createHeader(root, half, options);

        const top = half - 112;
        const bottom =
            -half + this.BOTTOM_NAV_HEIGHT;
        const bodyHeight = top - bottom;
        const body = MainMenuUIFactory.roundedBox(
            root,
            'FullscreenPaperBody',
            690,
            bodyHeight,
            0,
            (top + bottom) / 2,
            new Color(247, 241, 218, 255),
            new Color(185, 151, 83, 255),
            18,
            2,
        );

        return {
            body,
            bodyHeight,
            topLocalY: bodyHeight / 2,
            bottomLocalY: -bodyHeight / 2,
        };
    }

    private static createHeader(
        root: Node,
        half: number,
        options: MainMenuFullscreenShellOptions,
    ): void {
        const header = MainMenuUIFactory.node(
            root,
            'FullscreenHeader',
            720,
            104,
            0,
            half - 53,
        );

        const fallback = header.addComponent(Graphics);
        fallback.fillColor = new Color(21, 54, 50, 255);
        fallback.rect(-360, -52, 720, 104);
        fallback.fill();
        fallback.strokeColor = MainMenuTheme.goldDeep;
        fallback.lineWidth = 3;
        fallback.rect(-357, -49, 714, 98);
        fallback.stroke();

        ShopArt.attach(
            header,
            'headerBg',
            720,
            104,
            0,
            0,
            'stretch',
        );

        MainMenuIcons.create(
            header,
            'PageIcon',
            options.icon,
            -306,
            0,
            46,
            MainMenuTheme.white,
        );
        MainMenuUIFactory.label(
            header,
            'Title',
            options.title,
            -214,
            1,
            28,
            180,
            MainMenuTheme.white,
        );

        this.createResourceBadge(
            header,
            'Stamina',
            'currencyStaminaBg',
            `${options.metaState.stamina}`,
            82,
        );
        this.createResourceBadge(
            header,
            'Coin',
            'currencyCoinBg',
            `${options.metaState.coins}`,
            192,
        );
        this.createResourceBadge(
            header,
            'Gem',
            'currencyGemBg',
            `${options.metaState.gems}`,
            302,
        );
    }

    private static createResourceBadge(
        parent: Node,
        name: string,
        art: ShopArtKey,
        value: string,
        x: number,
    ): void {
        const badge = MainMenuUIFactory.node(
            parent,
            `Resource_${name}`,
            102,
            46,
            x,
            0,
        );
        ShopArt.attach(
            badge,
            art,
            102,
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
            56,
            MainMenuTheme.white,
        );
    }
}
