import {
    Color,
    Graphics,
    Label,
    Layers,
    Node,
    UITransform,
} from 'cc';

import {
    MainMenuIcons,
    MainMenuIconKind,
} from './widgets/MainMenuIcons';

import {
    MainMenuTheme,
} from './widgets/MainMenuTheme';

import {
    MainMenuUIFactory,
} from './widgets/MainMenuUIFactory';

export type MainMenuTabId =
    | 'shop'
    | 'hero'
    | 'battle'
    | 'warehouse'
    | 'upgrade';

export interface MainBottomNavOptions {
    parent:
        Node;

    initial:
        MainMenuTabId;

    onSelect:
        (
            tab:
                MainMenuTabId,
        ) => void;
}

interface TabConfig {
    id:
        MainMenuTabId;

    label:
        string;

    icon:
        MainMenuIconKind;
}

/**
 * 大厅底部固定导航。
 *
 * 结构、点击、选中态全部由代码搭建。
 * 只使用单个导航图标，不贴“整条导航设计图”。
 */
export class MainMenuBottomNav {
    private readonly root:
        Node;

    private readonly tabs =
        new Map<
            MainMenuTabId,
            Node
        >();

    private active:
        MainMenuTabId;

    constructor(
        private readonly options:
            MainBottomNavOptions,
    ) {
        this.active =
            options.initial;

        this.root =
            MainMenuUIFactory.node(
                options.parent,
                'BottomNavigation',
                720,
                132,
                0,
                -574,
            );

        this.drawBackground();
        this.createTabs();
        this.refresh();
    }

    setActive(
        tab:
            MainMenuTabId,
    ): void {
        this.active =
            tab;

        this.refresh();
    }

    setY(
        y:
            number,
    ): void {
        this.root.setPosition(
            0,
            y,
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

    private drawBackground():
        void {
        const g =
            this.root.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                29,
                34,
                32,
                255,
            );

        g.rect(
            -360,
            -66,
            720,
            132,
        );

        g.fill();

        g.fillColor =
            new Color(
                13,
                17,
                16,
                255,
            );

        g.rect(
            -360,
            55,
            720,
            11,
        );

        g.fill();

        for (
            const x
            of [
                -216,
                -72,
                72,
                216,
            ]
        ) {
            g.strokeColor =
                new Color(
                    90,
                    99,
                    94,
                    150,
                );

            g.lineWidth =
                1.5;

            g.moveTo(
                x,
                -54,
            );

            g.lineTo(
                x,
                51,
            );

            g.stroke();
        }
    }

    private createTabs():
        void {
        const configs:
            readonly TabConfig[] = [
                {
                    id:
                        'shop',
                    label:
                        '商店',
                    icon:
                        'shop',
                },
                {
                    id:
                        'hero',
                    label:
                        '英雄',
                    icon:
                        'hero',
                },
                {
                    id:
                        'battle',
                    label:
                        '战斗',
                    icon:
                        'battle',
                },
                {
                    id:
                        'warehouse',
                    label:
                        '仓库',
                    icon:
                        'warehouse',
                },
                {
                    id:
                        'upgrade',
                    label:
                        '升级',
                    icon:
                        'upgrade',
                },
            ];

        const xs =
            [
                -288,
                -144,
                0,
                144,
                288,
            ];

        configs.forEach(
            (
                config,
                index,
            ) => {
                const tab =
                    MainMenuUIFactory.node(
                        this.root,
                        `Tab_${config.id}`,
                        132,
                        118,
                        xs[index],
                        0,
                    );

                this.tabs.set(
                    config.id,
                    tab,
                );

                MainMenuIcons.create(
                    tab,
                    'Icon',
                    config.icon,
                    0,
                    20,
                    64,
                    new Color(
                        231,
                        235,
                        233,
                        255,
                    ),
                );

                MainMenuUIFactory.label(
                    tab,
                    'Label',
                    config.label,
                    0,
                    -31,
                    20,
                    104,
                    MainMenuTheme.white,
                );

                MainMenuUIFactory.bindPress(
                    tab,
                    () => {
                        this.options
                            .onSelect(
                                config.id,
                            );
                    },
                );
            },
        );
    }

    private refresh():
        void {
        for (
            const [
                id,
                tab,
            ]
            of this.tabs
        ) {
            tab
                .getChildByName(
                    'SelectedPlate',
                )
                ?.destroy();

            const active =
                id ===
                this.active;

            tab.setPosition(
                tab.position.x,
                active
                    ? 8
                    : 0,
                0,
            );

            if (
                active
            ) {
                const selected =
                    new Node(
                        'SelectedPlate',
                    );

                selected.layer =
                    Layers.Enum.UI_2D;

                tab.insertChild(
                    selected,
                    0,
                );

                selected
                    .addComponent(
                        UITransform,
                    )
                    .setContentSize(
                        126,
                        136,
                    );

                const g =
                    selected.addComponent(
                        Graphics,
                    );

                g.fillColor =
                    new Color(
                        252,
                        247,
                        228,
                        255,
                    );

                g.moveTo(
                    -61,
                    -58,
                );

                g.lineTo(
                    61,
                    -58,
                );

                g.lineTo(
                    56,
                    66,
                );

                g.lineTo(
                    -55,
                    66,
                );

                g.close();
                g.fill();

                g.strokeColor =
                    new Color(
                        27,
                        31,
                        30,
                        255,
                    );

                g.lineWidth =
                    4;

                g.stroke();

                g.strokeColor =
                    MainMenuTheme.gold;

                g.lineWidth =
                    3;

                g.moveTo(
                    -48,
                    52,
                );

                g.lineTo(
                    48,
                    52,
                );

                g.stroke();
            }

            const label =
                tab
                    .getChildByName(
                        'Label',
                    )
                    ?.getComponent(
                        Label,
                    );

            if (
                label
            ) {
                label.color =
                    active
                        ? MainMenuTheme
                            .ink
                        : MainMenuTheme
                            .white;
            }
        }
    }
}
