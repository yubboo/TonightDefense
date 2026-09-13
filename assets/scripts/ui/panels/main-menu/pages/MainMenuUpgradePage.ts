import {
    BlockInputEvents,
    Color,
    Node,
    UITransform,
} from 'cc';

import {
    MainMenuMetaState,
} from '../MainMenuModels';
import {
    MainMenuFullscreenShell,
} from '../widgets/MainMenuFullscreenShell';
import {
    MainMenuIcons,
    MainMenuIconKind,
} from '../widgets/MainMenuIcons';
import {
    MainMenuTheme,
} from '../widgets/MainMenuTheme';
import {
    MainMenuUIFactory,
} from '../widgets/MainMenuUIFactory';

type UpgradeSection = 'statue' | 'wall' | 'princess';

export interface MainMenuUpgradePageOptions {
    parent: Node;
    metaState: MainMenuMetaState;
}

export class MainMenuUpgradePage {
    private readonly root: Node;
    private viewportHeight = 1280;
    private active: UpgradeSection = 'statue';

    constructor(
        private readonly options: MainMenuUpgradePageOptions,
    ) {
        this.root = MainMenuUIFactory.node(
            options.parent,
            'UpgradePage',
            720,
            1600,
        );
        this.root.addComponent(BlockInputEvents);
        this.build();
    }

    setViewportHeight(viewportHeight: number): void {
        const next = Math.max(1280, Math.min(1600, viewportHeight));
        if (Math.abs(next - this.viewportHeight) < 0.5) return;

        this.viewportHeight = next;
        this.root.getComponent(UITransform)?.setContentSize(720, next);
        this.build();
    }

    destroy(): void {
        if (this.root.isValid) this.root.destroy();
    }

    private build(): void {
        for (const child of [...this.root.children]) child.destroy();
        this.root.removeAllChildren();

        const shell = MainMenuFullscreenShell.create(
            this.root,
            this.viewportHeight,
            {
                title: '王城升级',
                icon: 'upgrade',
                metaState: this.options.metaState,
            },
        );
        const configs: readonly [
            UpgradeSection,
            string,
            MainMenuIconKind,
        ][] = [
            ['statue', '守护雕像', 'upgrade'],
            ['wall', '城墙防线', 'wall'],
            ['princess', '公主守护', 'princess'],
        ];
        this.createTabs(shell.body, shell.topLocalY - 50, configs);
        this.createHeading(shell.body, shell.topLocalY - 112);
        const currentIcon =
            configs.find((item) => item[0] === this.active)?.[2]
            ?? 'upgrade';
        this.createContent(
            shell.body,
            shell.topLocalY,
            shell.bottomLocalY,
            currentIcon,
        );
    }

    private createTabs(
        panel: Node,
        y: number,
        configs: readonly [UpgradeSection, string, MainMenuIconKind][],
    ): void {
        const xs = [-220, 0, 220];
        configs.forEach(([id, text], index) => {
            const active = id === this.active;
            const tab = MainMenuUIFactory.roundedBox(
                panel,
                `Tab_${id}`,
                202,
                54,
                xs[index],
                y,
                active
                    ? new Color(255, 205, 80, 255)
                    : new Color(49, 57, 55, 255),
                MainMenuTheme.ink,
                8,
                3,
                true,
            );
            MainMenuUIFactory.label(
                tab,
                'Label',
                text,
                0,
                0,
                18,
                174,
                active ? MainMenuTheme.ink : MainMenuTheme.white,
            );
            MainMenuUIFactory.bindPress(tab, () => {
                this.active = id;
                this.build();
            });
        });
    }

    private createHeading(panel: Node, y: number): void {
        const title =
            this.active === 'statue'
                ? '守护雕像'
                : this.active === 'wall'
                    ? '城墙防线'
                    : '公主守护';
        MainMenuUIFactory.label(
            panel,
            'SectionTitle',
            title,
            -220,
            y,
            24,
            220,
            MainMenuTheme.ink,
        );
        MainMenuUIFactory.label(
            panel,
            'SectionSummary',
            '防线养成 · 属性总览',
            215,
            y,
            15,
            250,
            MainMenuTheme.inkSoft,
        );
    }

    private createContent(
        panel: Node,
        topLocalY: number,
        bottomLocalY: number,
        iconKind: MainMenuIconKind,
    ): void {
        const cardY = topLocalY - 350;
        const visual = MainMenuUIFactory.roundedBox(
            panel,
            'Visual',
            300,
            390,
            -165,
            cardY,
            new Color(218, 223, 211, 255),
            new Color(104, 92, 69, 255),
            14,
            4,
            true,
        );
        MainMenuIcons.create(
            visual,
            'LargeIcon',
            iconKind,
            0,
            48,
            190,
            this.active === 'princess'
                ? new Color(242, 141, 174, 255)
                : new Color(172, 179, 182, 255),
        );
        MainMenuUIFactory.label(
            visual,
            'Name',
            this.active === 'statue'
                ? '守护雕像'
                : this.active === 'wall'
                    ? '王城城墙'
                    : '王城公主',
            0,
            -132,
            24,
            250,
            MainMenuTheme.ink,
        );

        const stats = MainMenuUIFactory.roundedBox(
            panel,
            'Stats',
            300,
            390,
            165,
            cardY,
            new Color(249, 245, 231, 255),
            new Color(104, 92, 69, 255),
            14,
            4,
            true,
        );
        const lines =
            this.active === 'statue'
                ? [
                    ['等级', 'Lv.1'],
                    ['生命值', '2000'],
                    ['复活能力', '已启用'],
                    ['状态', '完整'],
                ]
                : this.active === 'wall'
                    ? [
                        ['等级', 'Lv.1'],
                        ['生命值', '待配置'],
                        ['防御', '待配置'],
                        ['状态', '完整'],
                    ]
                    : [
                        ['守护目标', '最终目标'],
                        ['生命值', '1'],
                        ['支援被动', '待开发'],
                        ['状态', '安全'],
                    ];

        lines.forEach(([label, value], index) => {
            const y = 126 - index * 62;
            MainMenuUIFactory.label(
                stats,
                `Label_${index}`,
                label,
                -78,
                y,
                17,
                110,
                MainMenuTheme.inkSoft,
            );
            MainMenuUIFactory.label(
                stats,
                `Value_${index}`,
                value,
                74,
                y,
                18,
                130,
                MainMenuTheme.ink,
            );
        });

        const upgrade = MainMenuUIFactory.yellowButton(
            stats,
            'UpgradeButton',
            238,
            62,
            0,
            -148,
        );
        MainMenuUIFactory.label(
            upgrade,
            'Label',
            this.active === 'statue' ? '升级暂未开放' : '培养暂未开放',
            0,
            4,
            18,
            190,
            MainMenuTheme.ink,
        );

        const rule = MainMenuUIFactory.roundedBox(
            panel,
            'RulePanel',
            630,
            154,
            0,
            topLocalY - 640,
            new Color(238, 229, 203, 255),
            new Color(185, 151, 83, 255),
            12,
            2,
        );
        MainMenuUIFactory.label(
            rule,
            'RuleTitle',
            '防线规则',
            -220,
            42,
            19,
            150,
            MainMenuTheme.ink,
        );
        MainMenuUIFactory.label(
            rule,
            'RuleHint',
            this.active === 'statue'
                ? '主角与伙伴阵亡后由雕像消耗自身生命复活；雕像损坏后停止全部复活。'
                : this.active === 'wall'
                    ? '雕像被破坏后怪物攻击城墙；城墙生命归零后破城。'
                    : '公主是最终守护目标；当前战斗规则为 1 点生命。',
            0,
            -18,
            16,
            570,
            MainMenuTheme.inkSoft,
            70,
        );
        MainMenuUIFactory.label(
            panel,
            'Footer',
            '升级页当前只建立正式 UI 入口，真实养成数值后续接入统一服务。',
            0,
            bottomLocalY + 46,
            15,
            620,
            MainMenuTheme.inkSoft,
        );
    }
}
