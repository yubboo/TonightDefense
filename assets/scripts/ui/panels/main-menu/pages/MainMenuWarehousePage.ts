import {
    Color,
    Graphics,
    Node,
} from 'cc';

import {
    MainMenuMetaState,
} from '../MainMenuModels';

import {
    MainMenuIcons,
} from '../widgets/MainMenuIcons';

import {
    MainMenuTheme,
} from '../widgets/MainMenuTheme';

import {
    MainMenuUIFactory,
} from '../widgets/MainMenuUIFactory';

import {
    MainMenuArt,
} from '../widgets/MainMenuArt';

export interface MainMenuWarehousePageOptions {
    parent: Node;
    metaState: MainMenuMetaState;
}

/**
 * 仓库页面现在读取真实 InventorySystem 数据，
 * 不再画固定“假数量”。
 */
export class MainMenuWarehousePage {
    private readonly root:
        Node;

    constructor(
        private readonly options:
            MainMenuWarehousePageOptions,
    ) {
        this.root =
            MainMenuUIFactory.node(
                options.parent,
                'WarehousePage',
                720,
                1000,
                0,
                0,
            );

        this.build();
    }

    destroy(): void {
        if (
            this.root
                .isValid
        ) {
            this.root.destroy();
        }
    }

    private build(): void {
        const panel =
            MainMenuUIFactory
                .paperCard(
                    this.root,
                    'WarehousePanel',
                    700,
                    970,
                    0,
                    0,
                );

        MainMenuArt.attach(
            panel,
            'panel-stage-blank',
            714,
            986,
            'stretch',
        );

        const title =
            MainMenuUIFactory
                .darkButton(
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
            'warehouse',
            -258,
            0,
            46,
            MainMenuTheme.white,
        );

        MainMenuUIFactory.label(
            title,
            'Title',
            '仓库',
            -158,
            0,
            30,
            140,
            MainMenuTheme.white,
        );

        MainMenuUIFactory.label(
            title,
            'Summary',
            `当前持有 ${this.options.metaState.warehouseItems.length} 种道具`,
            155,
            0,
            14,
            220,
            new Color(
                228,
                229,
                219,
                255,
            ),
        );

        const categories = [
            '全部',
            '装备',
            '道具',
            '材料',
            '消耗品',
        ];

        categories.forEach(
            (
                text,
                index,
            ) => {
                const tab =
                    MainMenuUIFactory
                        .roundedBox(
                            panel,
                            `Category_${index}`,
                            110,
                            52,
                            -265,
                            335 -
                                index *
                                62,
                            index ===
                                0
                                ? new Color(
                                    255,
                                    204,
                                    78,
                                    255,
                                )
                                : new Color(
                                    69,
                                    74,
                                    70,
                                    255,
                                ),
                            MainMenuTheme
                                .ink,
                            4,
                            3,
                        );

                MainMenuUIFactory
                    .label(
                        tab,
                        'Label',
                        text,
                        0,
                        0,
                        15,
                        88,
                        index ===
                            0
                            ? MainMenuTheme
                                .ink
                            : MainMenuTheme
                                .white,
                    );
            },
        );

        const content =
            MainMenuUIFactory
                .roundedBox(
                    panel,
                    'InventoryContent',
                    500,
                    680,
                    75,
                    10,
                    new Color(
                        54,
                        60,
                        57,
                        245,
                    ),
                    MainMenuTheme
                        .ink,
                    8,
                    4,
                );

        const items =
            this.options
                .metaState
                .warehouseItems;

        if (
            items.length ===
            0
        ) {
            MainMenuIcons.create(
                content,
                'EmptyIcon',
                'warehouse',
                0,
                70,
                88,
                new Color(
                    205,
                    193,
                    164,
                    255,
                ),
            );

            MainMenuUIFactory
                .label(
                    content,
                    'EmptyTitle',
                    '仓库还是空的',
                    0,
                    -10,
                    24,
                    320,
                    MainMenuTheme
                        .white,
                );

            MainMenuUIFactory
                .label(
                    content,
                    'EmptyDesc',
                    '进入战斗击败怪物后，金币会进入经济系统，掉落材料会进入仓库。',
                    0,
                    -65,
                    15,
                    390,
                    new Color(
                        202,
                        207,
                        199,
                        255,
                    ),
                    70,
                );

            return;
        }

        const rarityColor = {
            common:
                new Color(
                    89,
                    126,
                    107,
                    255,
                ),

            rare:
                new Color(
                    67,
                    116,
                    166,
                    255,
                ),

            epic:
                new Color(
                    126,
                    77,
                    151,
                    255,
                ),
        } as const;

        const visibleItems =
            items.slice(
                0,
                20,
            );

        visibleItems.forEach(
            (
                item,
                index,
            ) => {
                const col =
                    index %
                    4;

                const row =
                    Math.floor(
                        index /
                        4,
                    );

                const x =
                    -180 +
                    col *
                    120;

                const y =
                    245 -
                    row *
                    125;

                const slot =
                    MainMenuUIFactory
                        .roundedBox(
                            content,
                            `Item_${item.itemId}`,
                            104,
                            108,
                            x,
                            y,
                            new Color(
                                239,
                                232,
                                210,
                                255,
                            ),
                            new Color(
                                26,
                                30,
                                28,
                                255,
                            ),
                            6,
                            3,
                        );

                const icon =
                    MainMenuUIFactory
                        .roundedBox(
                            slot,
                            'Icon',
                            74,
                            58,
                            0,
                            18,
                            rarityColor[
                                item.rarity
                            ],
                            new Color(
                                31,
                                35,
                                33,
                                255,
                            ),
                            6,
                            2,
                        );

                const ig =
                    icon.getComponent(
                        Graphics,
                    )!;

                ig.fillColor =
                    new Color(
                        245,
                        218,
                        105,
                        255,
                    );

                ig.moveTo(
                    0,
                    20,
                );
                ig.lineTo(
                    16,
                    0,
                );
                ig.lineTo(
                    0,
                    -20,
                );
                ig.lineTo(
                    -16,
                    0,
                );
                ig.close();
                ig.fill();

                MainMenuUIFactory
                    .label(
                        slot,
                        'Name',
                        item.name,
                        0,
                        -28,
                        12,
                        92,
                        MainMenuTheme
                            .ink,
                    );

                MainMenuUIFactory
                    .label(
                        slot,
                        'Count',
                        `x${item.count}`,
                        25,
                        39,
                        12,
                        48,
                        MainMenuTheme
                            .white,
                    );
            },
        );

        MainMenuUIFactory.label(
            panel,
            'Footer',
            '掉落系统 → 奖励系统 → 背包状态 → 仓库持久化，数据已经真实联动。',
            70,
            -422,
            14,
            480,
            MainMenuTheme.inkSoft,
        );
    }
}
