/**
 * @architecture TonightDefense V1.0
 * @owner ui
 * @module panels/main-menu/pages
 *
 * 英雄仓库：英雄大系统的大厅入口。
 * 与普通仓库不同，这里只承载人物、职业、技能、培养和英雄装备信息。
 */
import {
    BlockInputEvents,
    Color,
    Node,
    UITransform,
} from 'cc';

import {
    CHARACTER_CATALOG,
} from '../../../../systems/hero/character/data/CharacterCatalog';
import {
    PROFESSION_CATALOG,
} from '../../../../systems/hero/profession/definition/ProfessionCatalog';
import {
    getProfessionSkillModule,
} from '../../../../systems/hero/skill/data/ProfessionSkillCatalog';
import {
    MainMenuMetaState,
} from '../MainMenuModels';
import {
    MainMenuFullscreenShell,
} from '../widgets/MainMenuFullscreenShell';
import {
    MainMenuTheme,
} from '../widgets/MainMenuTheme';
import {
    MainMenuUIFactory,
} from '../widgets/MainMenuUIFactory';

type HeroSection =
    | 'character'
    | 'profession'
    | 'skill'
    | 'growth'
    | 'equipment';

interface HeroHubCard {
    title: string;
    subtitle: string;
    detail: string;
    color: Color;
}

export interface MainMenuHeroPageOptions {
    parent: Node;
    metaState: MainMenuMetaState;
}

export class MainMenuHeroPage {
    private readonly root: Node;
    private viewportHeight = 1280;
    private active: HeroSection = 'character';

    constructor(
        private readonly options: MainMenuHeroPageOptions,
    ) {
        this.root = MainMenuUIFactory.node(
            options.parent,
            'HeroWarehousePage',
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
                title: '英雄仓库',
                icon: 'hero',
                metaState: this.options.metaState,
            },
        );

        this.createTabs(shell.body, shell.topLocalY - 50);
        this.createSectionHeading(shell.body, shell.topLocalY - 112);
        this.createCards(
            shell.body,
            shell.topLocalY,
            shell.bottomLocalY,
        );
    }

    private createTabs(panel: Node, y: number): void {
        const configs = [
            ['character', '人物'],
            ['profession', '职业'],
            ['skill', '技能'],
            ['growth', '培养'],
            ['equipment', '装备'],
        ] as const;
        const xs = [-260, -130, 0, 130, 260];

        configs.forEach(([id, text], index) => {
            const active = id === this.active;
            const tab = MainMenuUIFactory.roundedBox(
                panel,
                `Tab_${id}`,
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
                100,
                active ? MainMenuTheme.ink : MainMenuTheme.white,
            );
            MainMenuUIFactory.bindPress(tab, () => {
                this.active = id;
                this.build();
            });
        });
    }

    private createSectionHeading(panel: Node, y: number): void {
        const labels: Record<HeroSection, string> = {
            character: '英雄名册',
            profession: '职业体系',
            skill: '职业技能',
            growth: '英雄培养',
            equipment: '英雄装备',
        };
        MainMenuUIFactory.label(
            panel,
            'SectionTitle',
            labels[this.active],
            -225,
            y,
            24,
            210,
            MainMenuTheme.ink,
        );
        MainMenuUIFactory.label(
            panel,
            'SectionSummary',
            `${CHARACTER_CATALOG.length} 英雄 · ${PROFESSION_CATALOG.length} 职业`,
            220,
            y,
            15,
            240,
            MainMenuTheme.inkSoft,
        );
    }

    private createCards(
        panel: Node,
        topLocalY: number,
        bottomLocalY: number,
    ): void {
        const cards = this.getCards();
        const positions = [
            [-165, topLocalY - 255],
            [165, topLocalY - 255],
            [-165, topLocalY - 505],
            [165, topLocalY - 505],
        ] as const;

        cards.slice(0, 4).forEach((cardData, index) => {
            const [x, y] = positions[index];
            const card = MainMenuUIFactory.roundedBox(
                panel,
                `HeroHubCard_${index}`,
                310,
                226,
                x,
                y,
                new Color(249, 245, 231, 255),
                new Color(104, 92, 69, 255),
                12,
                3,
                true,
            );
            const badge = MainMenuUIFactory.roundedBox(
                card,
                'Badge',
                66,
                66,
                -104,
                65,
                cardData.color,
                MainMenuTheme.ink,
                8,
                3,
            );
            MainMenuUIFactory.label(
                badge,
                'Glyph',
                cardData.title.slice(0, 1),
                0,
                0,
                27,
                44,
                MainMenuTheme.white,
            );
            MainMenuUIFactory.label(
                card,
                'Title',
                cardData.title,
                32,
                76,
                21,
                190,
                MainMenuTheme.ink,
            );
            MainMenuUIFactory.label(
                card,
                'Subtitle',
                cardData.subtitle,
                32,
                43,
                15,
                190,
                cardData.color,
            );
            MainMenuUIFactory.label(
                card,
                'Detail',
                cardData.detail,
                0,
                -38,
                15,
                272,
                MainMenuTheme.inkSoft,
                92,
            );
        });

        const footer =
            this.active === 'skill'
                ? '战斗内：1 被动 + 4 主动；主动技能解锁后自动释放，三选一升级至 Lv.5'
                : this.active === 'equipment'
                    ? '英雄装备属于英雄养成；普通仓库只负责保存装备、材料和道具'
                    : '英雄仓库是英雄大系统入口，不与普通仓库混用数据职责';
        MainMenuUIFactory.label(
            panel,
            'FooterHint',
            footer,
            0,
            bottomLocalY + 46,
            15,
            620,
            MainMenuTheme.inkSoft,
        );
    }

    private getCards(): HeroHubCard[] {
        if (this.active === 'character') {
            return CHARACTER_CATALOG.slice(0, 4).map((character) => {
                const profession = PROFESSION_CATALOG.find(
                    (entry) => entry.id === character.professionId,
                )!;
                return {
                    title: character.name,
                    subtitle: `${profession.name} · ${character.faction}`,
                    detail: character.description,
                    color: this.toColor(profession.theme.main),
                };
            });
        }

        if (this.active === 'profession') {
            return PROFESSION_CATALOG.slice(0, 4).map((profession) => ({
                title: profession.name,
                subtitle: profession.roleLabel,
                detail: `${profession.skillTags.join(' / ')}\n基础攻击 ${profession.baseStats.attackPower} · 防御 ${profession.baseStats.defense}`,
                color: this.toColor(profession.theme.main),
            }));
        }

        if (this.active === 'skill') {
            return PROFESSION_CATALOG.slice(0, 4).map((profession) => {
                const module = getProfessionSkillModule(profession.id);
                return {
                    title: profession.name,
                    subtitle: `被动：${module.passive.name}`,
                    detail: module.activeSkills.map((skill) => skill.name).join(' · '),
                    color: this.toColor(profession.theme.main),
                };
            });
        }

        if (this.active === 'growth') {
            return [
                ['英雄等级', '长期培养', '大厅培养负责英雄永久成长；战斗内职业技能等级只在当前局生效。'],
                ['职业成长', '职业体系', '职业提供基础属性、攻击方式和固定技能模组。'],
                ['技能成长', '局内三选一', '被动初始 Lv.1；主动从 Lv.0 解锁，全部最高 Lv.5。'],
                ['突破规划', '后续扩展', '培养、突破、升星等永久成长继续归 HeroSystem。'],
            ].map(([title, subtitle, detail], index) => ({
                title,
                subtitle,
                detail,
                color: this.fallbackColor(index),
            }));
        }

        return [
            ['武器', '英雄装备', '攻击类装备通过 EquipmentLoadoutService 统一结算。'],
            ['防具', '英雄装备', '护甲、头盔、盾牌等提供防御与生命修正。'],
            ['饰品', '英雄装备', '戒指、项链等进入统一装备槽，不复制背包状态。'],
            ['特殊', '英雄装备', '翅膀等特殊槽位仍由同一装备服务管理。'],
        ].map(([title, subtitle, detail], index) => ({
            title,
            subtitle,
            detail,
            color: this.fallbackColor(index),
        }));
    }

    private toColor(rgb: readonly [number, number, number]): Color {
        return new Color(rgb[0], rgb[1], rgb[2], 255);
    }

    private fallbackColor(index: number): Color {
        const colors = [
            new Color(92, 123, 173, 255),
            new Color(171, 101, 72, 255),
            new Color(89, 145, 96, 255),
            new Color(126, 91, 157, 255),
        ];
        return colors[index % colors.length];
    }
}
