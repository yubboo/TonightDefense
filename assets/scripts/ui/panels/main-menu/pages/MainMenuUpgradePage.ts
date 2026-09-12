import {
    Color,
    Graphics,
    Node,
} from 'cc';

import {
    MainMenuIcons,
    MainMenuIconKind,
} from '../widgets/MainMenuIcons';

import { MainMenuTheme } from '../widgets/MainMenuTheme';
import { MainMenuUIFactory } from '../widgets/MainMenuUIFactory';
import { MainMenuArt } from '../widgets/MainMenuArt';

type UpgradeSection =
    | 'statue'
    | 'wall'
    | 'princess';

export class MainMenuUpgradePage {
    private readonly root: Node;

    private active: UpgradeSection = 'statue';

    constructor(parent: Node) {
        this.root = MainMenuUIFactory.node(
            parent,
            'UpgradePage',
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
        for (const child of [...this.root.children]) child.destroy();
        this.root.removeAllChildren();

        const panel = MainMenuUIFactory.paperCard(
            this.root,
            'UpgradePanel',
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
            'upgrade',
            -258,
            0,
            46,
            MainMenuTheme.white,
        );

        MainMenuUIFactory.label(
            title,
            'Title',
            '升级',
            -158,
            0,
            30,
            140,
            MainMenuTheme.white,
        );

        const configs:
            readonly [
                UpgradeSection,
                string,
                MainMenuIconKind,
            ][] = [
                ['statue', '防御塔雕像', 'upgrade'],
                ['wall', '城墙', 'wall'],
                ['princess', '公主', 'princess'],
            ];

        const xs = [-190, 0, 190];

        configs.forEach(([id, text], index) => {
            const active = id === this.active;

            const tab = MainMenuUIFactory.roundedBox(
                panel,
                `Tab_${id}`,
                176,
                50,
                xs[index],
                370,
                active
                    ? new Color(255, 205, 80, 255)
                    : new Color(63, 68, 65, 255),
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
                15,
                150,
                active
                    ? MainMenuTheme.ink
                    : MainMenuTheme.white,
            );

            MainMenuUIFactory.bindPress(
                tab,
                () => {
                    this.active = id;
                    this.build();
                },
            );
        });

        const currentIcon =
            configs.find(
                (item) =>
                    item[0] === this.active,
            )?.[2] ?? 'upgrade';

        this.createContent(panel, currentIcon);
    }

    private createContent(
        panel: Node,
        iconKind: MainMenuIconKind,
    ): void {
        const left = MainMenuUIFactory.roundedBox(
            panel,
            'Visual',
            220,
            370,
            -160,
            75,
            new Color(218, 223, 211, 255),
            MainMenuTheme.ink,
            5,
            4,
        );

        MainMenuIcons.create(
            left,
            'LargeIcon',
            iconKind,
            0,
            42,
            180,
            this.active === 'princess'
                ? new Color(242, 141, 174, 255)
                : new Color(172, 179, 182, 255),
        );

        MainMenuUIFactory.label(
            left,
            'Name',
            this.active === 'statue'
                ? '守护雕像'
                : this.active === 'wall'
                    ? '城墙'
                    : '公主',
            0,
            -95,
            22,
            180,
        );

        const right = MainMenuUIFactory.roundedBox(
            panel,
            'Stats',
            305,
            370,
            128,
            75,
            MainMenuTheme.cream,
            MainMenuTheme.ink,
            5,
            4,
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
            const y = 118 - index * 62;

            MainMenuUIFactory.label(
                right,
                `Label_${index}`,
                label,
                -78,
                y,
                16,
                100,
                MainMenuTheme.inkSoft,
            );

            MainMenuUIFactory.label(
                right,
                `Value_${index}`,
                value,
                75,
                y,
                17,
                120,
            );
        });

        const upgrade = MainMenuUIFactory.yellowButton(
            right,
            'UpgradeButton',
            220,
            58,
            0,
            -138,
        );

        MainMenuUIFactory.label(
            upgrade,
            'Label',
            this.active === 'statue'
                ? '升级暂未开放'
                : '培养暂未开放',
            0,
            0,
            18,
            160,
        );

        MainMenuUIFactory.bindPress(
            upgrade,
            () => {
                // 入口先建立，真实养成数值后续接入。
            },
        );

        MainMenuUIFactory.label(
            panel,
            'RuleHint',
            this.active === 'statue'
                ? '伙伴阵亡后由雕像消耗自身生命复活；雕像损坏后停止全部复活。'
                : this.active === 'wall'
                    ? '雕像被破坏后怪物攻击城墙；城墙生命归零后破城。'
                    : '公主是最终守护目标；当前战斗规则为 1 点生命。',
            0,
            -330,
            15,
            520,
            MainMenuTheme.inkSoft,
            70,
        );
    }
}
