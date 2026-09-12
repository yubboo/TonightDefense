import {
    Color,
    Graphics,
    Node,
    tween,
    Vec3,
} from 'cc';

import {
    MainMenuIcons,
} from '../widgets/MainMenuIcons';

import {
    MainMenuArt,
} from '../widgets/MainMenuArt';

import {
    MainMenuTheme,
} from '../widgets/MainMenuTheme';

import {
    MainMenuUIFactory,
} from '../widgets/MainMenuUIFactory';

import {
    MainMenuMetaState,
} from '../MainMenuModels';

export interface BattleHomePageOptions {
    parent:
        Node;

    showGuardian?:
        boolean;

    viewportHeight:
        number;

    metaState:
        MainMenuMetaState;

    onStartBattle:
        () => void;

    onOpenMeal:
        () => void;

    onClaimStageChest:
        (
            star:
                number,
        ) =>
            {
                ok:
                    boolean;
                message:
                    string;
            };

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

/**
 * 战斗大厅主页面。
 *
 * 设计稿是视觉基准，实际结构全部由 Cocos 节点构建：
 * - 快捷入口：按钮节点
 * - 关卡卡：纸张面板 + 动态文本
 * - 阶段奖励：真实 StageChest 状态
 * - 开始战斗：真实体力消耗
 */
export class MainMenuBattlePage {
    private readonly root:
        Node;

    private readonly stageCard:
        Node;

    private readonly startButton:
        Node;

    constructor(
        private readonly options:
            BattleHomePageOptions,
    ) {
        this.root =
            MainMenuUIFactory.node(
                options.parent,
                'BattleHomePage',
                720,
                1120,
                0,
                0,
            );

        if (
            options.showGuardian !==
            false
        ) {
            this.createGuardianFallback();
        }

        this.createQuickEntries();

        this.stageCard =
            this.createStageCard();

        this.startButton =
            this.createStartButton();

        this.setViewportHeight(
            options.viewportHeight,
        );
    }

    setViewportHeight(
        viewportHeight:
            number,
    ): void {
        const half =
            Math.max(
                640,
                viewportHeight /
                2,
            );

        /**
         * 导航顶边约在 -half + 132。
         * 开始按钮始终贴在导航上方，关卡卡再贴在开始按钮上方。
         */
        /**
         * V2.7：
         * 旧布局开始按钮底边与底部导航顶边只有约 19 设计像素，
         * 在长屏缩放后视觉上像“粘”在底栏上。
         *
         * 整个战斗页底部组合上移 22 像素，
         * 保持关卡卡与开始按钮之间的原有关系，
         * 只增加开始按钮与底部导航之间的呼吸空间。
         */
        /**
         * V2.8：
         * V2.7 把按钮整体上移后，按钮与底部导航之间出现了过大的空白区。
         * 这里恢复为更紧凑的底部节奏：
         * - 开始按钮靠近底栏，但保留安全间距；
         * - 关卡卡与开始按钮之间仍保留约 23 设计像素。
         */
        const startY =
            -half +
            205;

        const stageY =
            startY +
            222;

        this.startButton
            .setPosition(
                0,
                startY,
                0,
            );

        this.stageCard
            .setPosition(
                0,
                stageY,
                0,
            );
    }

    destroy():
        void {
        if (
            this.root.isValid
        ) {
            this.root.destroy();
        }
    }

    private createGuardianFallback():
        void {
        const statue =
            MainMenuUIFactory.node(
                this.root,
                'GuardianStatue',
                180,
                220,
                0,
                162,
            );

        const g =
            statue.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                178,
                177,
                163,
                255,
            );

        g.roundRect(
            -58,
            -91,
            116,
            22,
            6,
        );
        g.fill();

        g.fillColor =
            new Color(
                148,
                157,
                166,
                255,
            );

        g.roundRect(
            -29,
            -66,
            58,
            104,
            18,
        );

        g.circle(
            -31,
            -5,
            21,
        );

        g.circle(
            31,
            -5,
            21,
        );
        g.fill();

        g.fillColor =
            new Color(
                114,
                128,
                142,
                255,
            );

        g.circle(
            0,
            49,
            25,
        );
        g.fill();

        g.moveTo(
            -25,
            56,
        );
        g.lineTo(
            -10,
            81,
        );
        g.lineTo(
            0,
            62,
        );
        g.lineTo(
            10,
            81,
        );
        g.lineTo(
            25,
            56,
        );
        g.close();
        g.fill();

        g.fillColor =
            new Color(
                69,
                207,
                239,
                255,
            );

        g.moveTo(
            0,
            -4,
        );
        g.lineTo(
            12,
            -21,
        );
        g.lineTo(
            0,
            -40,
        );
        g.lineTo(
            -12,
            -21,
        );
        g.close();
        g.fill();

        g.strokeColor =
            new Color(
                83,
                62,
                47,
                255,
            );

        g.lineWidth =
            6;

        g.moveTo(
            47,
            -69,
        );
        g.lineTo(
            58,
            51,
        );
        g.stroke();

        g.fillColor =
            new Color(
                77,
                205,
                239,
                255,
            );

        g.moveTo(
            58,
            74,
        );
        g.lineTo(
            69,
            58,
        );
        g.lineTo(
            58,
            42,
        );
        g.lineTo(
            47,
            58,
        );
        g.close();
        g.fill();
    }


    /**
     * 大厅左右悬浮入口专用按钮。
     *
     * 不修改 MainMenuUIFactory 公共组件，
     * 避免影响商店、底栏、关卡卡等其他 UI。
     *
     * 视觉语言：
     * - 深色切角牌匾
     * - 黑色厚外框
     * - 金色内框
     * - 下方独立文字带
     * - 右上角通知红点
     */
    private createQuickEntryButton(
        name:
            string,
        x:
            number,
        y:
            number,
    ): Node {
        const width =
            92;

        const height =
            100;

        const node =
            MainMenuUIFactory.node(
                this.root,
                name,
                width,
                height,
                x,
                y,
            );

        const g =
            node.addComponent(
                Graphics,
            );

        const hw =
            width /
            2;

        const hh =
            height /
            2;

        const cut =
            13;

        const path =
            (
                offsetX:
                    number,
                offsetY:
                    number,
            ) => {
                g.moveTo(
                    -hw +
                        cut +
                        offsetX,
                    -hh +
                        offsetY,
                );

                g.lineTo(
                    hw -
                        cut +
                        offsetX,
                    -hh +
                        offsetY,
                );

                g.lineTo(
                    hw +
                        offsetX,
                    -hh +
                        cut +
                        offsetY,
                );

                g.lineTo(
                    hw +
                        offsetX,
                    hh -
                        cut +
                        offsetY,
                );

                g.lineTo(
                    hw -
                        cut +
                        offsetX,
                    hh +
                        offsetY,
                );

                g.lineTo(
                    -hw +
                        cut +
                        offsetX,
                    hh +
                        offsetY,
                );

                g.lineTo(
                    -hw +
                        offsetX,
                    hh -
                        cut +
                        offsetY,
                );

                g.lineTo(
                    -hw +
                        offsetX,
                    -hh +
                        cut +
                        offsetY,
                );

                g.close();
            };

        // 阴影
        g.fillColor =
            new Color(
                10,
                15,
                14,
                150,
            );

        path(
            5,
            -7,
        );

        g.fill();

        // 黑色外板
        g.fillColor =
            new Color(
                24,
                29,
                28,
                255,
            );

        path(
            0,
            0,
        );

        g.fill();

        g.strokeColor =
            new Color(
                10,
                13,
                12,
                255,
            );

        g.lineWidth =
            5;

        path(
            0,
            0,
        );

        g.stroke();

        // 深绿色主体
        const inset =
            6;

        const innerW =
            hw -
            inset;

        const innerH =
            hh -
            inset;

        const innerCut =
            10;

        g.fillColor =
            new Color(
                42,
                54,
                49,
                255,
            );

        g.moveTo(
            -innerW +
                innerCut,
            -innerH,
        );

        g.lineTo(
            innerW -
                innerCut,
            -innerH,
        );

        g.lineTo(
            innerW,
            -innerH +
                innerCut,
        );

        g.lineTo(
            innerW,
            innerH -
                innerCut,
        );

        g.lineTo(
            innerW -
                innerCut,
            innerH,
        );

        g.lineTo(
            -innerW +
                innerCut,
            innerH,
        );

        g.lineTo(
            -innerW,
            innerH -
                innerCut,
        );

        g.lineTo(
            -innerW,
            -innerH +
                innerCut,
        );

        g.close();
        g.fill();

        // 金色内框
        g.strokeColor =
            new Color(
                221,
                176,
                66,
                235,
            );

        g.lineWidth =
            2;

        g.moveTo(
            -innerW +
                innerCut,
            -innerH,
        );

        g.lineTo(
            innerW -
                innerCut,
            -innerH,
        );

        g.lineTo(
            innerW,
            -innerH +
                innerCut,
        );

        g.lineTo(
            innerW,
            innerH -
                innerCut,
        );

        g.lineTo(
            innerW -
                innerCut,
            innerH,
        );

        g.lineTo(
            -innerW +
                innerCut,
            innerH,
        );

        g.lineTo(
            -innerW,
            innerH -
                innerCut,
        );

        g.lineTo(
            -innerW,
            -innerH +
                innerCut,
        );

        g.close();
        g.stroke();

        // 图标与文字之间的金色短分隔
        g.strokeColor =
            new Color(
                219,
                171,
                63,
                175,
            );

        g.lineWidth =
            2;

        g.moveTo(
            -24,
            -18,
        );

        g.lineTo(
            24,
            -18,
        );

        g.stroke();

        return node;
    }

    private createQuickEntries():
        void {
        const entries = [
            {
                id:
                    'territory',
                label:
                    '领地',
                icon:
                    'territory' as const,
                x:
                    -306,
                y:
                    152,
            },
            {
                id:
                    'challenge',
                label:
                    '挑战',
                icon:
                    'challenge' as const,
                x:
                    -306,
                y:
                    30,
            },
            {
                id:
                    'sweep',
                label:
                    '扫荡',
                icon:
                    'sweep' as const,
                x:
                    -306,
                y:
                    -92,
            },
            {
                id:
                    'activity',
                label:
                    '活动',
                icon:
                    'activity' as const,
                x:
                    306,
                y:
                    152,
            },
            {
                id:
                    'more',
                label:
                    '更多',
                icon:
                    'more' as const,
                x:
                    306,
                y:
                    30,
            },
            {
                id:
                    'meal',
                label:
                    '吃饭',
                icon:
                    'meal' as const,
                x:
                    306,
                y:
                    -92,
            },
        ] as const;

        entries.forEach(
            (
                entry,
            ) => {
                const button =
                    this.createQuickEntryButton(
                        `Quick_${entry.id}`,
                        entry.x,
                        entry.y,
                    );

                MainMenuIcons.create(
                    button,
                    'Icon',
                    entry.icon,
                    0,
                    18,
                    44,
                    MainMenuTheme.white,
                );

                MainMenuUIFactory.label(
                    button,
                    'Label',
                    entry.label,
                    0,
                    -33,
                    18,
                    76,
                    new Color(
                        248,
                        240,
                        211,
                        255,
                    ),
                );

                const showDot =
                    entry.id ===
                        'meal'
                        ? this
                            .options
                            .metaState
                            .meals
                            .some(
                                (
                                    meal,
                                ) =>
                                    meal.status ===
                                    'claimable',
                            )
                        : entry.id !==
                            'more';

                if (
                    showDot
                ) {
                    const dot =
                        MainMenuUIFactory.node(
                            button,
                            'NotifyDot',
                            18,
                            18,
                            35,
                            39,
                        );

                    const dg =
                        dot.addComponent(
                            Graphics,
                        );

                    // 红点外圈阴影
                    dg.fillColor =
                        new Color(
                            50,
                            22,
                            18,
                            170,
                        );

                    dg.circle(
                        2,
                        -2,
                        9,
                    );

                    dg.fill();

                    dg.fillColor =
                        MainMenuTheme.red;

                    dg.circle(
                        0,
                        0,
                        7,
                    );

                    dg.fill();

                    dg.strokeColor =
                        MainMenuTheme.white;

                    dg.lineWidth =
                        2;

                    dg.circle(
                        0,
                        0,
                        7,
                    );

                    dg.stroke();
                }

                MainMenuUIFactory.bindPress(
                    button,
                    () => {
                        if (
                            entry.id ===
                            'meal'
                        ) {
                            this.options
                                .onOpenMeal();

                            return;
                        }

                        this.options
                            .onQuickEntry(
                                entry.id,
                            );
                    },
                );
            },
        );
    }


    private createStageCard():
        Node {
        const progressState =
            this.options
                .metaState
                .chapterProgress;

        const stageChest =
            this.options
                .metaState
                .stageChest;

        const chapterNumber =
            progressState
                .chapterNumber;

        const totalWaves =
            Math.max(
                1,
                progressState
                    .totalWaves,
            );

        const completedWaves =
            Math.max(
                0,
                Math.min(
                    totalWaves,
                    progressState
                        .completedWaves,
                ),
            );

        const progressRatio =
            completedWaves /
            totalWaves;

        const card =
            MainMenuUIFactory
                .paperCard(
                    this.root,
                    'StageCard',
                    566,
                    292,
                    0,
                    -230,
                );

        MainMenuArt.attach(
            card,
            'panel-stage-blank',
            598,
            318,
            'stretch',
        );

        /**
         * 顶部标题区域：
         * 关卡编号是第一视觉层级，
         * “40个小关”只作为辅助说明。
         */
        MainMenuUIFactory.label(
            card,
            'Chapter',
            `第 ${chapterNumber} 关`,
            0,
            104,
            42,
            310,
            MainMenuTheme.ink,
        );

        MainMenuUIFactory.label(
            card,
            'WaveCount',
            `${totalWaves} 个小关`,
            0,
            67,
            15,
            190,
            MainMenuTheme.inkSoft,
        );

        /**
         * 小关最高进度。
         *
         * 当前战斗没有“从中途继续”机制，
         * 所以这里使用“最高进度”而不是误导性的“当前进度”。
         */
        const track =
            MainMenuUIFactory.node(
                card,
                'ChapterProgress',
                420,
                70,
                0,
                20,
            );

        const tg =
            track.addComponent(
                Graphics,
            );

        const trackWidth =
            360;

        const trackX =
            -trackWidth /
            2;

        // 轨道阴影
        tg.fillColor =
            new Color(
                20,
                25,
                24,
                75,
            );

        tg.roundRect(
            trackX,
            -8,
            trackWidth,
            16,
            8,
        );

        tg.fill();

        // 轨道底色
        tg.fillColor =
            new Color(
                55,
                61,
                58,
                255,
            );

        tg.roundRect(
            trackX,
            -6,
            trackWidth,
            12,
            6,
        );

        tg.fill();

        const fillWidth =
            trackWidth *
            progressRatio;

        if (
            fillWidth >
            0
        ) {
            tg.fillColor =
                new Color(
                    250,
                    199,
                    49,
                    255,
                );

            tg.roundRect(
                trackX,
                -6,
                Math.max(
                    10,
                    fillWidth,
                ),
                12,
                6,
            );

            tg.fill();
        }

        /**
         * 10 / 20 / 30 / 40 四个里程碑。
         * 这里只表现小关进度，不擅自把它们定义成 1/2/3 星条件。
         */
        const milestoneWaves =
            [
                10,
                20,
                30,
                40,
            ];

        milestoneWaves
            .forEach(
                (
                    wave,
                ) => {
                    const ratio =
                        wave /
                        totalWaves;

                    const x =
                        trackX +
                        trackWidth *
                        ratio;

                    const reached =
                        completedWaves >=
                        wave;

                    tg.fillColor =
                        new Color(
                            28,
                            33,
                            31,
                            255,
                        );

                    tg.circle(
                        x,
                        0,
                        wave ===
                            totalWaves
                            ? 13
                            : 10,
                    );

                    tg.fill();

                    tg.fillColor =
                        reached
                            ? new Color(
                                250,
                                200,
                                50,
                                255,
                            )
                            : new Color(
                                238,
                                236,
                                221,
                                255,
                            );

                    tg.circle(
                        x,
                        0,
                        wave ===
                            totalWaves
                            ? 7
                            : 5,
                    );

                    tg.fill();

                    MainMenuUIFactory.label(
                        track,
                        `Milestone_${wave}`,
                        `${wave}`,
                        x,
                        -24,
                        11,
                        34,
                        MainMenuTheme.inkSoft,
                    );
                },
            );

        MainMenuUIFactory.label(
            card,
            'ProgressText',
            `最高进度：${completedWaves} / ${totalWaves}`,
            0,
            -16,
            14,
            250,
            MainMenuTheme.inkSoft,
        );

        /**
         * 阶段宝箱区。
         *
         * 星级如何解锁继续由 LevelSystem 决定。
         * UI 只展示真实 unlockedStars / claimedStars，
         * 不在大厅里擅自发放星级。
         */
        const reward =
            MainMenuUIFactory
                .roundedBox(
                    card,
                    'StageRewards',
                    458,
                    106,
                    0,
                    -87,
                    new Color(
                        48,
                        56,
                        52,
                        248,
                    ),
                    new Color(
                        25,
                        30,
                        28,
                        255,
                    ),
                    10,
                    3,
                );

        const rg =
            reward.getComponent(
                Graphics,
            );

        if (
            rg
        ) {
            rg.strokeColor =
                new Color(
                    219,
                    173,
                    64,
                    215,
                );

            rg.lineWidth =
                2;

            rg.roundRect(
                -222,
                -47,
                444,
                94,
                8,
            );

            rg.stroke();
        }

        MainMenuUIFactory.label(
            reward,
            'Title',
            '阶段宝箱',
            -169,
            35,
            15,
            100,
            new Color(
                249,
                205,
                72,
                255,
            ),
        );

        MainMenuUIFactory.label(
            reward,
            'Hint',
            `已解锁 ${stageChest.unlockedStars}/3 星`,
            137,
            35,
            12,
            130,
            new Color(
                222,
                219,
                198,
                255,
            ),
        );

        const xs =
            [
                -145,
                0,
                145,
            ];

        xs.forEach(
            (
                x,
                index,
            ) => {
                const star =
                    index +
                    1;

                const unlocked =
                    stageChest
                        .unlockedStars >=
                    star;

                const claimed =
                    stageChest
                        .claimedStars
                        .indexOf(
                            star,
                        ) >=
                    0;

                const slot =
                    MainMenuUIFactory
                        .roundedBox(
                            reward,
                            `StageChest_${star}`,
                            112,
                            68,
                            x,
                            -13,
                            claimed
                                ? new Color(
                                    61,
                                    101,
                                    72,
                                    255,
                                )
                                : unlocked
                                    ? new Color(
                                        105,
                                        74,
                                        137,
                                        255,
                                    )
                                    : new Color(
                                        67,
                                        73,
                                        69,
                                        255,
                                    ),
                            unlocked
                                ? new Color(
                                    238,
                                    197,
                                    78,
                                    240,
                                )
                                : new Color(
                                    154,
                                    158,
                                    149,
                                    210,
                                ),
                            7,
                            2,
                        );

                MainMenuIcons.create(
                    slot,
                    'RewardIcon',
                    star ===
                        1
                        ? 'coin'
                        : star ===
                            2
                            ? 'diamond'
                            : 'warehouse',
                    -30,
                    4,
                    31,
                );

                MainMenuUIFactory.label(
                    slot,
                    'Star',
                    `${star}★`,
                    17,
                    11,
                    15,
                    45,
                    unlocked
                        ? new Color(
                            255,
                            215,
                            83,
                            255,
                        )
                        : new Color(
                            202,
                            202,
                            190,
                            255,
                        ),
                );

                MainMenuUIFactory.label(
                    slot,
                    'State',
                    claimed
                        ? '已领取'
                        : unlocked
                            ? '可领取'
                            : '未解锁',
                    17,
                    -15,
                    11,
                    58,
                    claimed
                        ? new Color(
                            181,
                            237,
                            191,
                            255,
                        )
                        : unlocked
                            ? MainMenuTheme.white
                            : new Color(
                                183,
                                185,
                                176,
                                255,
                            ),
                );

                if (
                    unlocked &&
                    !claimed
                ) {
                    MainMenuUIFactory.bindPress(
                        slot,
                        () => {
                            this.options
                                .onClaimStageChest(
                                    star,
                                );
                        },
                    );
                }
            },
        );

        return card;
    }

    private createStartButton():
        Node {
        const button =
            MainMenuUIFactory
                .yellowButton(
                    this.root,
                    'StartBattleButton',
                    545,
                    104,
                    0,
                    -438,
                );

        /**
         * 按参考稿把主按钮拆成两层：
         *
         *       ⚔  开始战斗
         *          ⚡ ×5
         *
         * 不再使用“消耗 5 体力”长文本，
         * 避免窄屏缩放后第二行被挤压。
         */
        MainMenuIcons.create(
            button,
            'BattleIcon',
            'battle',
            -154,
            8,
            62,
            MainMenuTheme.white,
        );

        MainMenuUIFactory.label(
            button,
            'Title',
            '开始战斗',
            52,
            17,
            36,
            300,
            MainMenuTheme.ink,
        );

        /**
         * 体力消耗必须显示在金色按钮内部。
         *
         * V2.7 的 y=-27 太低，运行时会落到按钮黑边下面；
         * 同时“×”在部分字体环境下显示不稳定。
         *
         * V2.8 改为：
         *     ⚡ x5
         * 并整体上移到按钮内部。
         */
        const stamina =
            MainMenuUIFactory.node(
                button,
                'StaminaCost',
                92,
                24,
                52,
                -14,
            );

        MainMenuIcons.create(
            stamina,
            'StaminaIcon',
            'stamina',
            -17,
            0,
            19,
            new Color(
                48,
                178,
                66,
                255,
            ),
        );

        MainMenuUIFactory.label(
            stamina,
            'Value',
            `x${this.options.metaState.battleStaminaCost}`,
            13,
            0,
            15,
            42,
            new Color(
                61,
                53,
                38,
                255,
            ),
        );

        MainMenuUIFactory.bindPress(
            button,
            this.options
                .onStartBattle,
        );

        tween(
            button,
        )
            .repeatForever(
                tween()
                    .to(
                        1.0,
                        {
                            scale:
                                new Vec3(
                                    1.012,
                                    1.012,
                                    1,
                                ),
                        },
                        {
                            easing:
                                'sineInOut',
                        },
                    )
                    .to(
                        1.0,
                        {
                            scale:
                                new Vec3(
                                    1,
                                    1,
                                    1,
                                ),
                        },
                        {
                            easing:
                                'sineInOut',
                        },
                    ),
            )
            .start();

        return button;
    }
}
