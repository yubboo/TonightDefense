/**
 * MainMenu 720 宽设计坐标规范。
 *
 * 来源：用户确认的《今晚守城》主界面参考图。
 * 规则：视觉尺寸集中在这里，避免在 View 里反复“凭感觉”改数字。
 *
 * Cocos 坐标：画布中心为 (0, 0)，Y 向上。
 */
export const MainMenuLayoutSpec = {
    topHud: {
        height: 118,

        profile: {
            x: -200,
            y: 0,
            width: 276,
            height: 90,
        },

        avatar: {
            x: -99,
            y: 0,
            size: 64,
        },

        resources: {
            y: 16,
            width: 106,
            height: 46,
            staminaX: 35,
            coinX: 150,
            gemX: 265,
        },

        utilities: {
            y: -45,
            size: 48,
            mailX: 220,
            settingsX: 300,
        },
    },

    logo: {
        width: 410,
        height: 250,
        topOffsetFromHudCenter: 190,
    },
} as const;
