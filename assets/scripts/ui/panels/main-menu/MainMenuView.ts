import {
    BlockInputEvents,
    Color,
    Graphics,
    Label,
    Node,
    tween,
    UIOpacity,
    UITransform,
} from 'cc';

import {
    MainMenuBottomNav,
    MainMenuTabId,
} from './MainMenuBottomNav';

import {
    MainMenuIcons,
} from './widgets/MainMenuIcons';

import {
    MainMenuArt,
} from './widgets/MainMenuArt';

import {
    MainMenuLobbyBackdrop,
} from './widgets/MainMenuLobbyBackdrop';

import {
    MainMenuTheme,
} from './widgets/MainMenuTheme';

import {
    MainMenuUIFactory,
} from './widgets/MainMenuUIFactory';

import {
    MainMenuLayoutSpec,
} from './layout/MainMenuLayoutSpec';

import {
    RemoteSpriteLoader,
} from '../../resources/RemoteSpriteLoader';

import {
    MainMenuBattlePage,
} from './pages/MainMenuBattlePage';

import {
    MainMenuHeroPage,
} from './pages/MainMenuHeroPage';

import {
    MainMenuShopPage,
} from './pages/MainMenuShopPage';

import {
    MainMenuWarehousePage,
} from './pages/MainMenuWarehousePage';

import {
    MainMenuUpgradePage,
} from './pages/MainMenuUpgradePage';

import {
    MainMenuActionResult,
    MainMenuMealId,
    MainMenuMetaState,
} from './MainMenuModels';

import {
    GameSettingsPanel,
} from '../settings/GameSettingsPanel';

export interface MainMenuCallbacks {
    getMetaState:
        () =>
            MainMenuMetaState;

    onStartBattle:
        () => void;

    onBuyStamina:
        () =>
            MainMenuActionResult;

    onClaimMeal:
        (
            mealId:
                MainMenuMealId,
        ) =>
            MainMenuActionResult;

    onClaimStageChest:
        (
            star:
                number,
        ) =>
            MainMenuActionResult;

    onQuickEntry:
        (
            entry:
                'territory' |
                'challenge' |
                'sweep' |
                'activity' |
                'more',
        ) => void;
}

interface MainMenuPage {
    destroy():
        void;

    setViewportHeight?:
        (
            viewportHeight:
                number,
        ) => void;
}

/**
 * 固定大厅主视图。
 *
 * UI 设计约束：
 * - 720 设计宽。
 * - 长屏优先按宽适配，背景向上下延展，不留黑边。
 * - 左上玩家资料。
 * - 右上体力 / 金币 / 钻石。
 * - 中间保留视觉呼吸区。
 * - 底部固定：商店 / 英雄 / 战斗 / 仓库 / 升级。
 */
export class MainMenuView {
    private readonly root:
        Node;

    private readonly pageLayer:
        Node;

    private readonly callbacks:
        MainMenuCallbacks;

    private readonly canvas:
        Node;

    private readonly topHudRoot:
        Node;

    private readonly logoRoot:
        Node;

    private nav:
        MainMenuBottomNav | null =
        null;

    private currentPage:
        MainMenuPage | null =
        null;

    private toast:
        Node | null =
        null;

    private mealPanel:
        Node | null =
        null;

    private staminaValueLabel:
        Label | null =
        null;

    private coinValueLabel:
        Label | null =
        null;

    private gemValueLabel:
        Label | null =
        null;

    private playerNameLabel:
        Label | null =
        null;

    private playerUidLabel:
        Label | null =
        null;

    private playerLevelLabel:
        Label | null =
        null;

    private playerAvatarNode:
        Node | null =
        null;

    private activeTab:
        MainMenuTabId =
        'battle';

    private loading =
        false;

    private backgroundReady =
        false;

    private visibleDesignHeight =
        1280;

    private readonly fitCanvas =
        (): void => {
            const size =
                this.canvas
                    .getComponent(
                        UITransform,
                    )
                    ?.contentSize;

            if (
                !size ||
                !this.root.isValid
            ) {
                return;
            }

            /**
             * 长屏按宽度适配。
             * 这样游戏宽度始终填满，不会把 720x1280 整体缩在屏幕中间。
             */
            let scale =
                size.width /
                720;

            let visibleHeight =
                size.height /
                scale;

            /**
             * 极矮屏保险：
             * 如果按宽度适配不足 1280，则退回按高度适配。
             */
            if (
                visibleHeight <
                1280
            ) {
                scale =
                    size.height /
                    1280;

                visibleHeight =
                    size.height /
                    scale;
            }

            this.visibleDesignHeight =
                Math.max(
                    1280,
                    Math.min(
                        MainMenuLobbyBackdrop
                            .DESIGN_HEIGHT,
                        visibleHeight,
                    ),
                );

            this.root.setScale(
                scale,
                scale,
                1,
            );

            this.applyResponsiveLayout();
        };

    constructor(
        canvas:
            Node,
        callbacks:
            MainMenuCallbacks,
    ) {
        this.callbacks =
            callbacks;

        this.canvas =
            canvas;

        canvas
            .getChildByName(
                'MainMenuView',
            )
            ?.destroy();

        this.root =
            MainMenuUIFactory.node(
                canvas,
                'MainMenuView',
                720,
                MainMenuLobbyBackdrop
                    .DESIGN_HEIGHT,
            );

        /**
         * 先建立页面层，避免背景资源同步加载回调时访问未初始化字段。
         */
        this.pageLayer =
            MainMenuUIFactory.node(
                this.root,
                'PageLayer',
                720,
                1120,
                0,
                0,
            );

        MainMenuLobbyBackdrop.create(
            this.root,
            () => {
                this.backgroundReady =
                    true;

                this.pageLayer
                    .getChildByName(
                        'BattleHomePage',
                    )
                    ?.getChildByName(
                        'GuardianStatue',
                    )
                    ?.destroy();
            },
        );

        this.topHudRoot =
            this.createTopHud();

        this.refreshMetaHud();

        this.logoRoot =
            this.createLogo();

        this.nav =
            new MainMenuBottomNav({
                parent:
                    this.root,

                initial:
                    'battle',

                onSelect:
                    (
                        tab,
                    ) => {
                        if (
                            this.loading
                        ) {
                            return;
                        }

                        this.openTab(
                            tab,
                        );
                    },
            });

        this.openTab(
            'battle',
        );

        this.fitCanvas();

        this.canvas.on(
            Node.EventType
                .SIZE_CHANGED,
            this.fitCanvas,
        );

        const opacity =
            this.root.addComponent(
                UIOpacity,
            );

        opacity.opacity =
            0;

        tween(
            opacity,
        )
            .to(
                0.18,
                {
                    opacity:
                        255,
                },
                {
                    easing:
                        'sineOut',
                },
            )
            .start();
    }

    destroy():
        void {
        this.canvas.off(
            Node.EventType
                .SIZE_CHANGED,
            this.fitCanvas,
        );

        this.currentPage
            ?.destroy();

        this.nav
            ?.destroy();

        if (
            this.root.isValid
        ) {
            this.root.destroy();
        }
    }

    setLoading(
        loading:
            boolean,
    ): void {
        this.loading =
            loading;

        if (
            loading
        ) {
            this.showToast(
                '正在进入第1关…',
            );
        }
    }

    showToast(
        message:
            string,
    ): void {
        this.toast?.destroy();

        const y =
            -this.visibleDesignHeight /
            2 +
            178;

        const node =
            MainMenuUIFactory
                .darkButton(
                    this.root,
                    'Toast',
                    430,
                    58,
                    0,
                    y,
                );

        const opacity =
            node.addComponent(
                UIOpacity,
            );

        opacity.opacity =
            0;

        MainMenuUIFactory.label(
            node,
            'Text',
            message,
            0,
            0,
            17,
            390,
            MainMenuTheme.white,
        );

        this.toast =
            node;

        tween(
            opacity,
        )
            .to(
                0.12,
                {
                    opacity:
                        255,
                },
            )
            .delay(
                1.1,
            )
            .to(
                0.18,
                {
                    opacity:
                        0,
                },
            )
            .call(
                () => {
                    if (
                        node.isValid
                    ) {
                        node.destroy();
                    }

                    if (
                        this.toast ===
                        node
                    ) {
                        this.toast =
                            null;
                    }
                },
            )
            .start();
    }


    private createTopHud():
        Node {
        const spec =
            MainMenuLayoutSpec
                .topHud;

        const root =
            MainMenuUIFactory.node(
                this.root,
                'TopHUD',
                720,
                spec.height,
            );

        /**
         * 顶部 HUD 只承担两件事：
         * - 左侧玩家资料
         * - 右侧资源与系统入口
         *
         * 参考图是视觉基准，但所有文字/数字均由代码动态生成，
         * 不直接贴带文字的参考截图。
         */
        const meta =
            this.callbacks
                .getMetaState();

        const profileState =
            meta.playerProfile;

        const profile =
            MainMenuUIFactory
                .paperCard(
                    root,
                    'PlayerProfile',
                    spec.profile.width,
                    spec.profile.height,
                    spec.profile.x,
                    spec.profile.y,
                );

        const avatar =
            MainMenuUIFactory
                .roundedBox(
                    profile,
                    'Avatar',
                    spec.avatar.size,
                    spec.avatar.size,
                    spec.avatar.x,
                    spec.avatar.y,
                    new Color(
                        58,
                        63,
                        72,
                        255,
                    ),
                    MainMenuTheme.ink,
                    6,
                    3,
                );

        /**
         * 这里使用已有“英雄”原子图标做账号头像占位，
         * 不再画临时圆脸/三角帽。
         * 后续接真实账号头像时只替换 Avatar 内容。
         */
        this.playerAvatarNode =
            avatar;

        MainMenuArt.attach(
            avatar,
            'icon-hero',
            56,
            56,
            'contain',
        );

        if (
            profileState.avatarUrl
        ) {
            RemoteSpriteLoader.load(
                avatar,
                profileState.avatarUrl,
            );
        }

        this.playerNameLabel =
            MainMenuUIFactory.label(
                profile,
                'Name',
                profileState.nickname,
                36,
                23,
                18,
                160,
            );

        this.playerUidLabel =
            MainMenuUIFactory.label(
                profile,
                'Uid',
                `UID: ${profileState.uid}`,
                20,
                1,
                11,
                130,
                MainMenuTheme.inkSoft,
            );

        this.playerLevelLabel =
            MainMenuUIFactory.label(
                profile,
                'Level',
                `Lv.${profileState.level}`,
                -20,
                -28,
                12,
                54,
            );

        const exp =
            MainMenuUIFactory.node(
                profile,
                'Exp',
                104,
                16,
                57,
                -28,
            );

        const eg =
            exp.addComponent(
                Graphics,
            );

        eg.fillColor =
            new Color(
                50,
                57,
                54,
                255,
            );

        eg.roundRect(
            -52,
            -5,
            104,
            10,
            5,
        );
        eg.fill();

        eg.fillColor =
            new Color(
                73,
                191,
                116,
                255,
            );

        eg.roundRect(
            -52,
            -5,
            24,
            10,
            5,
        );
        eg.fill();

        /**
         * 右侧三资源统一尺寸。
         * V2.6 的重点是先把布局锁定，不再每版漂移坐标。
         */
        this.staminaValueLabel =
            this.createStaminaBadge(
                root,
                spec.resources.staminaX,
                spec.resources.y,
            );

        this.coinValueLabel =
            this.createCurrency(
                root,
                'Coin',
                'coin',
                spec.resources.coinX,
                spec.resources.y,
                MainMenuTheme.gold,
            );

        this.gemValueLabel =
            this.createCurrency(
                root,
                'Gem',
                'gem',
                spec.resources.gemX,
                spec.resources.y,
                MainMenuTheme.purple,
            );

        const mail =
            MainMenuUIFactory
                .darkButton(
                    root,
                    'Mail',
                    spec.utilities.size,
                    spec.utilities.size,
                    spec.utilities.mailX,
                    spec.utilities.y,
                );

        MainMenuIcons.create(
            mail,
            'Icon',
            'mail',
            0,
            0,
            31,
            MainMenuTheme.white,
        );

        const dot =
            MainMenuUIFactory.node(
                mail,
                'Dot',
                14,
                14,
                18,
                18,
            );

        const dg =
            dot.addComponent(
                Graphics,
            );

        dg.fillColor =
            MainMenuTheme.red;

        dg.circle(
            0,
            0,
            6,
        );
        dg.fill();

        const settings =
            MainMenuUIFactory
                .darkButton(
                    root,
                    'Settings',
                    spec.utilities.size,
                    spec.utilities.size,
                    spec.utilities.settingsX,
                    spec.utilities.y,
                );

        MainMenuIcons.create(
            settings,
            'Icon',
            'settings',
            0,
            0,
            31,
            MainMenuTheme.white,
        );

        MainMenuUIFactory.bindPress(
            mail,
            () =>
                this.showToast(
                    '邮件入口已建立，功能后续接入',
                ),
        );

        MainMenuUIFactory.bindPress(
            settings,
            () => {
                GameSettingsPanel.open(
                    this.canvas,
                );
            },
        );

        return root;
    }

    private createCurrency(
        parent:
            Node,
        name:
            string,
        kind:
            'coin' |
            'gem',
        x:
            number,
        y:
            number,
        accent:
            Color,
    ): Label {
        const spec =
            MainMenuLayoutSpec
                .topHud
                .resources;

        const box =
            MainMenuUIFactory
                .darkButton(
                    parent,
                    name,
                    spec.width,
                    spec.height,
                    x,
                    y,
                );

        /**
         * 货币使用正式原子素材；不再叠加程序绘制的 coin/gem 图标。
         */
        MainMenuArt.attach(
            box,
            kind === 'coin'
                ? 'icon-coin'
                : 'icon-gem-purple',
            30,
            30,
            'contain',
        ).setPosition(
            -34,
            0,
            0,
        );

        const value =
            MainMenuUIFactory.label(
                box,
                'Value',
                '0',
                2,
                0,
                17,
                48,
                MainMenuTheme.white,
            );

        MainMenuUIFactory.label(
            box,
            'Plus',
            '+',
            39,
            0,
            20,
            20,
            new Color(
                255,
                211,
                83,
                255,
            ),
        );

        return value;
    }

    private createStaminaBadge(
        parent:
            Node,
        x:
            number,
        y:
            number,
    ): Label {
        const spec =
            MainMenuLayoutSpec
                .topHud
                .resources;

        const box =
            MainMenuUIFactory
                .darkButton(
                    parent,
                    'Stamina',
                    spec.width,
                    spec.height,
                    x,
                    y,
                );

        MainMenuIcons.create(
            box,
            'Icon',
            'stamina',
            -34,
            0,
            28,
            new Color(
                104,
                220,
                82,
                255,
            ),
        );

        const value =
            MainMenuUIFactory.label(
                box,
                'Value',
                '300',
                2,
                0,
                17,
                50,
                MainMenuTheme.white,
            );

        MainMenuUIFactory.label(
            box,
            'Plus',
            '+',
            39,
            0,
            20,
            20,
            new Color(
                255,
                211,
                83,
                255,
            ),
        );

        MainMenuUIFactory.bindPress(
            box,
            () => {
                this.openTab(
                    'shop',
                );

                this.showToast(
                    '已打开商店体力补给',
                );
            },
        );

        return value;
    }

    private refreshMetaHud():
        void {
        const state =
            this.callbacks
                .getMetaState();

        if (
            this.playerNameLabel
        ) {
            this.playerNameLabel.string =
                state.playerProfile.nickname;
        }

        if (
            this.playerUidLabel
        ) {
            this.playerUidLabel.string =
                `UID: ${state.playerProfile.uid}`;
        }

        if (
            this.playerLevelLabel
        ) {
            this.playerLevelLabel.string =
                `Lv.${state.playerProfile.level}`;
        }

        if (
            this.staminaValueLabel
        ) {
            this.staminaValueLabel
                .string =
                `${state.stamina}`;
        }

        if (
            this.coinValueLabel
        ) {
            this.coinValueLabel
                .string =
                `${state.coins}`;
        }

        if (
            this.gemValueLabel
        ) {
            this.gemValueLabel
                .string =
                `${state.gems}`;
        }
    }

    private handleMetaAction(
        result:
            MainMenuActionResult,
        refreshCurrentPage =
            true,
    ): void {
        this.showToast(
            result.message,
        );

        this.refreshMetaHud();

        if (
            refreshCurrentPage
        ) {
            this.openTab(
                this.activeTab,
            );
        }
    }

    private showMealPanel():
        void {
        this.mealPanel
            ?.destroy();

        const state =
            this.callbacks
                .getMetaState();

        const overlay =
            MainMenuUIFactory.node(
                this.root,
                'MealStaminaPanel',
                720,
                MainMenuLobbyBackdrop
                    .DESIGN_HEIGHT,
            );

        overlay.addComponent(
            BlockInputEvents,
        );

        this.mealPanel =
            overlay;

        const dim =
            overlay.addComponent(
                Graphics,
            );

        dim.fillColor =
            new Color(
                18,
                23,
                20,
                185,
            );

        dim.rect(
            -360,
            -800,
            720,
            1600,
        );
        dim.fill();

        const card =
            MainMenuUIFactory
                .paperCard(
                    overlay,
                    'MealCard',
                    550,
                    620,
                    0,
                    0,
                );

        MainMenuUIFactory.label(
            card,
            'Title',
            '一日四餐 · 免费体力',
            0,
            248,
            28,
            390,
            MainMenuTheme.ink,
        );

        MainMenuUIFactory.label(
            card,
            'Desc',
            '在对应时间段领取，每餐 +30 体力',
            0,
            210,
            15,
            410,
            MainMenuTheme.inkSoft,
        );

        state.meals.forEach(
            (
                meal,
                index,
            ) => {
                const y =
                    130 -
                    index *
                    105;

                const row =
                    MainMenuUIFactory
                        .roundedBox(
                            card,
                            `Meal_${meal.id}`,
                            470,
                            86,
                            0,
                            y,
                            new Color(
                                244,
                                237,
                                216,
                                255,
                            ),
                            MainMenuTheme.ink,
                            10,
                            3,
                        );

                MainMenuIcons.create(
                    row,
                    'MealIcon',
                    'meal',
                    -186,
                    0,
                    40,
                    new Color(
                        215,
                        157,
                        67,
                        255,
                    ),
                );

                MainMenuUIFactory.label(
                    row,
                    'MealName',
                    meal.label,
                    -103,
                    15,
                    19,
                    100,
                    MainMenuTheme.ink,
                );

                MainMenuUIFactory.label(
                    row,
                    'Time',
                    meal.timeLabel,
                    -96,
                    -17,
                    13,
                    150,
                    MainMenuTheme.inkSoft,
                );

                const statusText =
                    meal.status ===
                        'claimable'
                        ? `领取 +${meal.reward}`
                        : meal.status ===
                            'claimed'
                            ? '已领取'
                            : meal.status ===
                                'waiting'
                                ? '未到时间'
                                : '已错过';

                const button =
                    meal.status ===
                        'claimable'
                        ? MainMenuUIFactory
                            .yellowButton(
                                row,
                                'ClaimButton',
                                142,
                                50,
                                147,
                                0,
                            )
                        : MainMenuUIFactory
                            .darkButton(
                                row,
                                'ClaimButton',
                                142,
                                50,
                                147,
                                0,
                            );

                MainMenuUIFactory.label(
                    button,
                    'Text',
                    statusText,
                    0,
                    0,
                    15,
                    118,
                    meal.status ===
                        'claimable'
                        ? MainMenuTheme.ink
                        : MainMenuTheme.white,
                );

                if (
                    meal.status ===
                    'claimable'
                ) {
                    MainMenuUIFactory.bindPress(
                        button,
                        () => {
                            const result =
                                this.callbacks
                                    .onClaimMeal(
                                        meal.id,
                                    );

                            this.showToast(
                                result.message,
                            );

                            this.refreshMetaHud();
                            this.showMealPanel();
                        },
                    );
                }
            },
        );

        const close =
            MainMenuUIFactory
                .darkButton(
                    card,
                    'Close',
                    120,
                    50,
                    0,
                    -252,
                );

        MainMenuUIFactory.label(
            close,
            'Text',
            '关闭',
            0,
            0,
            16,
            90,
            MainMenuTheme.white,
        );

        MainMenuUIFactory.bindPress(
            close,
            () => {
                overlay.destroy();

                if (
                    this.mealPanel ===
                    overlay
                ) {
                    this.mealPanel =
                        null;
                }
            },
        );
    }

    private createLogo():
        Node {
        const logo =
            MainMenuUIFactory.node(
                this.root,
                'GameLogo',
                520,
                310,
            );

        const g =
            logo.addComponent(
                Graphics,
            );

        /**
         * 正式 Logo 未加载时的兜底，
         * MainMenuArt 加载成功后会自动关闭 Graphics。
         */
        g.fillColor =
            new Color(
                37,
                78,
                61,
                255,
            );

        g.roundRect(
            -205,
            -48,
            410,
            118,
            30,
        );
        g.fill();

        g.strokeColor =
            MainMenuTheme.gold;

        g.lineWidth =
            4;

        g.roundRect(
            -198,
            -41,
            396,
            104,
            26,
        );
        g.stroke();

        const fallbackTitle =
            MainMenuUIFactory.label(
                logo,
                'FallbackTitle',
                '今晚守城',
                0,
                17,
                48,
                370,
                new Color(
                    255,
                    224,
                    149,
                    255,
                ),
            );

        MainMenuArt.attach(
            logo,
            'logo',
            MainMenuLayoutSpec.logo.width,
            MainMenuLayoutSpec.logo.height,
            'contain',
            () => {
                /**
                 * 正式 Logo 图片本身已经包含“今晚守城”文字。
                 *
                 * 旧代码只关闭了 Graphics 兜底，
                 * 却没有关闭 FallbackTitle Label，
                 * 所以正式图片加载完成后会叠两层文字，
                 * 造成用户截图中的字体重影 / 发虚。
                 */
                if (
                    fallbackTitle.node.isValid
                ) {
                    fallbackTitle.node.active =
                        false;
                }
            },
        );

        return logo;
    }

    private applyResponsiveLayout():
        void {
        const half =
            this.visibleDesignHeight /
            2;

        const topY =
            half -
            58;

        this.topHudRoot
            .setPosition(
                0,
                topY,
                0,
            );

        this.logoRoot
            .setPosition(
                0,
                topY -
                MainMenuLayoutSpec
                    .logo
                    .topOffsetFromHudCenter,
                0,
            );

        this.nav
            ?.setY(
                -half +
                66,
            );

        this.currentPage
            ?.setViewportHeight?.(
                this.visibleDesignHeight,
            );

        this.applyPagePosition();
    }

    private applyPagePosition():
        void {
        this.pageLayer
            .setPosition(
                0,
                this.activeTab ===
                    'battle'
                    ? 0
                    : -5,
                0,
            );
    }

    private openTab(
        tab:
            MainMenuTabId,
    ): void {
        this.activeTab =
            tab;

        this.currentPage
            ?.destroy();

        this.currentPage =
            null;

        this.nav
            ?.setActive(
                tab,
            );

        const metaState =
            this.callbacks
                .getMetaState();

        const lobby =
            tab ===
            'battle';

        this.logoRoot.active =
            lobby;

        switch (
            tab
        ) {
            case 'shop':
                this.currentPage =
                    new MainMenuShopPage({
                        parent:
                            this.pageLayer,

                        metaState,

                        onBuyStamina:
                            () => {
                                const result =
                                    this.callbacks
                                        .onBuyStamina();

                                this.handleMetaAction(
                                    result,
                                    true,
                                );

                                return result;
                            },
                    });
                break;

            case 'hero':
                this.currentPage =
                    new MainMenuHeroPage(
                        this.pageLayer,
                    );
                break;

            case 'warehouse':
                this.currentPage =
                    new MainMenuWarehousePage({
                        parent:
                            this.pageLayer,

                        metaState,
                    });
                break;

            case 'upgrade':
                this.currentPage =
                    new MainMenuUpgradePage(
                        this.pageLayer,
                    );
                break;

            case 'battle':
            default:
                this.currentPage =
                    new MainMenuBattlePage({
                        parent:
                            this.pageLayer,

                        showGuardian:
                            !this.backgroundReady,

                        viewportHeight:
                            this.visibleDesignHeight,

                        metaState,

                        onStartBattle:
                            () => {
                                if (
                                    this.loading
                                ) {
                                    return;
                                }

                                this.callbacks
                                    .onStartBattle();
                            },

                        onOpenMeal:
                            () => {
                                this.showMealPanel();
                            },

                        onClaimStageChest:
                            (
                                star,
                            ) => {
                                const result =
                                    this.callbacks
                                        .onClaimStageChest(
                                            star,
                                        );

                                this.handleMetaAction(
                                    result,
                                    true,
                                );

                                return result;
                            },

                        onQuickEntry:
                            (
                                entry,
                            ) => {
                                this.callbacks
                                    .onQuickEntry(
                                        entry,
                                    );
                            },
                    });
                break;
        }

        this.applyPagePosition();

        this.currentPage
            ?.setViewportHeight?.(
                this.visibleDesignHeight,
            );
    }
}
