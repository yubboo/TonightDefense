import {
    BlockInputEvents,
    Color,
    Graphics,
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
} from '../widgets/MainMenuIcons';
import {
    MainMenuTheme,
} from '../widgets/MainMenuTheme';
import {
    MainMenuUIFactory,
} from '../widgets/MainMenuUIFactory';

export interface MainMenuWarehousePageOptions {
    parent: Node;
    metaState: MainMenuMetaState;
}

type WarehouseCategory =
    | 'all'
    | 'equipment'
    | 'item'
    | 'material'
    | 'consumable';

/** 仓库页面只读取 InventorySystem 快照，不复制库存状态。 */
export class MainMenuWarehousePage {
    private readonly root: Node;
    private viewportHeight = 1280;
    private activeCategory: WarehouseCategory = 'all';

    constructor(
        private readonly options: MainMenuWarehousePageOptions,
    ) {
        this.root = MainMenuUIFactory.node(
            options.parent,
            'WarehousePage',
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
                title: '王城仓库',
                icon: 'warehouse',
                metaState: this.options.metaState,
            },
        );
        this.createTabs(shell.body, shell.topLocalY - 50);
        this.createHeading(shell.body, shell.topLocalY - 112);
        this.createInventory(
            shell.body,
            shell.topLocalY,
            shell.bottomLocalY,
        );
    }

    private createTabs(panel: Node, y: number): void {
        const categories = [
            ['all', '全部'],
            ['equipment', '装备'],
            ['item', '道具'],
            ['material', '材料'],
            ['consumable', '消耗品'],
        ] as const;
        const xs = [-260, -130, 0, 130, 260];

        categories.forEach(([id, text], index) => {
            const active = id === this.activeCategory;
            const tab = MainMenuUIFactory.roundedBox(
                panel,
                `Category_${id}`,
                120,
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
                104,
                active ? MainMenuTheme.ink : MainMenuTheme.white,
            );
            MainMenuUIFactory.bindPress(tab, () => {
                this.activeCategory = id;
                this.build();
            });
        });
    }

    private createHeading(panel: Node, y: number): void {
        MainMenuUIFactory.label(
            panel,
            'SectionTitle',
            '道具一览',
            -230,
            y,
            24,
            190,
            MainMenuTheme.ink,
        );
        MainMenuUIFactory.label(
            panel,
            'Summary',
            `当前持有 ${this.options.metaState.warehouseItems.length} 种道具`,
            205,
            y,
            15,
            270,
            MainMenuTheme.inkSoft,
        );
    }

    private createInventory(
        panel: Node,
        topLocalY: number,
        bottomLocalY: number,
    ): void {
        const contentTop = topLocalY - 150;
        const contentBottom = bottomLocalY + 78;
        const contentHeight = contentTop - contentBottom;
        const content = MainMenuUIFactory.roundedBox(
            panel,
            'InventoryContent',
            646,
            contentHeight,
            0,
            (contentTop + contentBottom) / 2,
            new Color(45, 56, 52, 250),
            new Color(104, 92, 69, 255),
            14,
            3,
            true,
        );

        const items = this.options.metaState.warehouseItems;
        if (items.length === 0) {
            this.createEmptyState(content);
            return;
        }

        const rarityColor = {
            common: new Color(89, 126, 107, 255),
            rare: new Color(67, 116, 166, 255),
            epic: new Color(126, 77, 151, 255),
            legendary: new Color(201, 137, 48, 255),
        } as const;

        const visibleItems = items.slice(0, 20);
        const startY = contentHeight / 2 - 88;
        visibleItems.forEach((item, index) => {
            const col = index % 4;
            const row = Math.floor(index / 4);
            const slot = MainMenuUIFactory.roundedBox(
                content,
                `Item_${item.itemId}`,
                136,
                126,
                -228 + col * 152,
                startY - row * 142,
                new Color(249, 245, 231, 255),
                rarityColor[item.rarity],
                10,
                4,
            );
            const icon = MainMenuUIFactory.roundedBox(
                slot,
                'Icon',
                88,
                64,
                0,
                22,
                rarityColor[item.rarity],
                MainMenuTheme.ink,
                8,
                2,
            );
            const iconGraphics = icon.getComponent(Graphics)!;
            iconGraphics.fillColor = new Color(245, 218, 105, 255);
            iconGraphics.moveTo(0, 21);
            iconGraphics.lineTo(17, 0);
            iconGraphics.lineTo(0, -21);
            iconGraphics.lineTo(-17, 0);
            iconGraphics.close();
            iconGraphics.fill();

            MainMenuUIFactory.label(
                slot,
                'Name',
                item.name,
                0,
                -35,
                16,
                120,
                MainMenuTheme.ink,
            );
            MainMenuUIFactory.label(
                slot,
                'Count',
                `x${item.count}`,
                42,
                43,
                15,
                48,
                MainMenuTheme.white,
            );
        });

        const footer =
            this.activeCategory === 'all'
                ? '掉落奖励进入统一背包状态，仓库页面只负责读取与展示。'
                : '分类页 UI 已就位；当前库存快照暂未提供道具类型，先显示全部库存。';
        MainMenuUIFactory.label(
            panel,
            'Footer',
            footer,
            0,
            bottomLocalY + 46,
            15,
            620,
            MainMenuTheme.inkSoft,
        );
    }

    private createEmptyState(content: Node): void {
        MainMenuIcons.create(
            content,
            'EmptyIcon',
            'warehouse',
            0,
            76,
            108,
            new Color(205, 193, 164, 255),
        );
        MainMenuUIFactory.label(
            content,
            'EmptyTitle',
            '仓库还是空的',
            0,
            -22,
            26,
            340,
            MainMenuTheme.white,
        );
        MainMenuUIFactory.label(
            content,
            'EmptyDesc',
            '进入战斗获得材料与装备后，会由统一背包系统保存并显示在这里。',
            0,
            -76,
            16,
            500,
            new Color(220, 224, 215, 255),
            70,
        );
    }
}
