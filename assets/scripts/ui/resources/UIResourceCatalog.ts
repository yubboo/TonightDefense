/**
 * 《今晚守城》UI 资源路径总表
 *
 * 规则：
 * - 这里只写 resources/ 后面的路径。
 * - 不写 assets/resources。
 * - 不写 .png。
 * - SpriteFrame 加载时由加载器自动补 /spriteFrame。
 *
 * 以后新增 UI 时，先决定它属于哪个模块，再放到对应目录。
 */
export const UIResourceCatalog = {
    common: {
        buttons: {
            goldBlank:
                'ui/common/buttons/button-gold-blank',
        },

        panels: {
            paperBlank:
                'ui/common/panels/panel-paper-blank',
        },

        currency: {
            coin:
                'ui/common/currency/icon-coin',

            gemPurple:
                'ui/common/currency/icon-gem-purple',

            diamondBlue:
                'ui/common/currency/icon-diamond-blue',
        },
    },

    mainMenu: {
        branding: {
            logo:
                'ui/main-menu/branding/logo',
        },

        navigation: {
            shop:
                'ui/main-menu/navigation/icon-shop',

            hero:
                'ui/main-menu/navigation/icon-hero',

            battle:
                'ui/main-menu/navigation/icon-battle',

            warehouse:
                'ui/main-menu/navigation/icon-warehouse',

            upgrade:
                'ui/main-menu/navigation/icon-upgrade',
        },
    },

    battle: {
        home: {
            backgroundCastle:
                'ui/battle/home/background-castle',
        },

        /**
         * 后续战斗 UI 固定放这里：
         * ui/battle/hud/
         * ui/battle/skill-choice/
         * ui/battle/boss-warning/
         * ui/battle/result/
         * ui/battle/icons/
         */
    },

    /**
     * 以下模块已经把正式目录建立好。
     * 等对应 UI 图片制作完成后直接放进去。
     *
     * shop:
     *   ui/shop/...
     *
     * hero:
     *   ui/hero/...
     *
     * warehouse:
     *   ui/warehouse/...
     *
     * upgrade:
     *   ui/upgrade/...
     */
} as const;

/**
 * 为了不大面积修改当前大厅代码，
 * MainMenuArt 继续使用原来的逻辑资源名，
 * 但真实磁盘路径已经按系统重新分类。
 */
export const MainMenuArtPaths = {
    'background-castle':
        UIResourceCatalog
            .battle
            .home
            .backgroundCastle,

    'logo':
        UIResourceCatalog
            .mainMenu
            .branding
            .logo,

    'button-gold-blank':
        UIResourceCatalog
            .common
            .buttons
            .goldBlank,

    'panel-stage-blank':
        UIResourceCatalog
            .common
            .panels
            .paperBlank,

    'icon-coin':
        UIResourceCatalog
            .common
            .currency
            .coin,

    'icon-gem-purple':
        UIResourceCatalog
            .common
            .currency
            .gemPurple,

    'icon-diamond-blue':
        UIResourceCatalog
            .common
            .currency
            .diamondBlue,

    'icon-shop':
        UIResourceCatalog
            .mainMenu
            .navigation
            .shop,

    'icon-hero':
        UIResourceCatalog
            .mainMenu
            .navigation
            .hero,

    'icon-battle':
        UIResourceCatalog
            .mainMenu
            .navigation
            .battle,

    'icon-warehouse':
        UIResourceCatalog
            .mainMenu
            .navigation
            .warehouse,

    'icon-upgrade':
        UIResourceCatalog
            .mainMenu
            .navigation
            .upgrade,
} as const;

export type MainMenuArtKey =
    keyof typeof MainMenuArtPaths;
