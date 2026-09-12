/**
 * @architecture TonightDefense V1.0
 * @owner ui
 * @module panels/main-menu/pages
 *
 * 英雄仓库：英雄大系统的大厅入口。
 * 与普通仓库不同，这里只承载人物、职业、技能、培养和英雄装备信息。
 */
import {
    Color,
    Node,
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

export class MainMenuHeroPage {
    private readonly root: Node;
    private active:
        HeroSection = 'character';

    constructor(parent: Node) {
        this.root =
            MainMenuUIFactory.node(
                parent,
                'HeroWarehousePage',
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
        for (
            const child
            of [...this.root.children]
        ) {
            child.destroy();
        }
        this.root.removeAllChildren();

        const panel =
            MainMenuUIFactory.paperCard(
                this.root,
                'HeroWarehousePanel',
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
            MainMenuUIFactory.darkButton(
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
            'hero',
            -258,
            0,
            46,
            MainMenuTheme.white,
        );
        MainMenuUIFactory.label(
            title,
            'Title',
            '英雄仓库',
            -130,
            0,
            28,
            190,
            MainMenuTheme.white,
        );
        MainMenuUIFactory.label(
            title,
            'Summary',
            `${CHARACTER_CATALOG.length} 英雄 · ${PROFESSION_CATALOG.length} 职业`,
            170,
            0,
            13,
            230,
            new Color(
                226,
                230,
                220,
                255,
            ),
        );

        this.createTabs(panel);
        this.createCards(panel);
    }

    private createTabs(
        panel: Node,
    ): void {
        const configs = [
            ['character', '人物'],
            ['profession', '职业'],
            ['skill', '技能'],
            ['growth', '培养'],
            ['equipment', '装备'],
        ] as const;
        const xs =
            [-244, -122, 0, 122, 244];

        configs.forEach(
            ([id, text], index) => {
                const active =
                    id === this.active;
                const tab =
                    MainMenuUIFactory.roundedBox(
                        panel,
                        `Tab_${id}`,
                        112,
                        50,
                        xs[index],
                        370,
                        active
                            ? new Color(
                                255,
                                205,
                                80,
                                255,
                            )
                            : new Color(
                                61,
                                66,
                                63,
                                255,
                            ),
                        MainMenuTheme.ink,
                        5,
                        3,
                    );
                MainMenuUIFactory.label(
                    tab,
                    'Label',
                    text,
                    0,
                    0,
                    16,
                    90,
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
            },
        );
    }

    private createCards(
        panel: Node,
    ): void {
        const cards =
            this.getCards();
        const positions = [
            [-168, 145],
            [168, 145],
            [-168, -145],
            [168, -145],
        ] as const;

        cards.slice(0, 4)
            .forEach(
                (cardData, index) => {
                    const [x, y] =
                        positions[index];
                    const card =
                        MainMenuUIFactory.roundedBox(
                            panel,
                            `HeroHubCard_${index}`,
                            300,
                            248,
                            x,
                            y,
                            new Color(
                                243,
                                239,
                                225,
                                255,
                            ),
                            MainMenuTheme.ink,
                            8,
                            4,
                            true,
                        );

                    const badge =
                        MainMenuUIFactory.roundedBox(
                            card,
                            'Badge',
                            62,
                            62,
                            -92,
                            67,
                            cardData.color,
                            MainMenuTheme.ink,
                            4,
                            3,
                        );
                    MainMenuUIFactory.label(
                        badge,
                        'Glyph',
                        cardData.title.slice(0, 1),
                        0,
                        0,
                        26,
                        42,
                        MainMenuTheme.white,
                    );
                    MainMenuUIFactory.label(
                        card,
                        'Title',
                        cardData.title,
                        26,
                        77,
                        20,
                        190,
                        MainMenuTheme.ink,
                    );
                    MainMenuUIFactory.label(
                        card,
                        'Subtitle',
                        cardData.subtitle,
                        26,
                        45,
                        14,
                        190,
                        cardData.color,
                    );
                    MainMenuUIFactory.label(
                        card,
                        'Detail',
                        cardData.detail,
                        0,
                        -38,
                        14,
                        260,
                        MainMenuTheme.inkSoft,
                    );
                },
            );

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
            -350,
            14,
            610,
            MainMenuTheme.inkSoft,
        );
    }

    private getCards():
        HeroHubCard[] {
        if (this.active === 'character') {
            return CHARACTER_CATALOG
                .slice(0, 4)
                .map(
                    (character) => {
                        const profession =
                            PROFESSION_CATALOG.find(
                                (entry) =>
                                    entry.id ===
                                    character.professionId,
                            )!;
                        return {
                            title: character.name,
                            subtitle:
                                `${profession.name} · ${character.faction}`,
                            detail:
                                character.description,
                            color:
                                this.toColor(
                                    profession.theme.main,
                                ),
                        };
                    },
                );
        }

        if (this.active === 'profession') {
            return PROFESSION_CATALOG
                .slice(0, 4)
                .map(
                    (profession) => ({
                        title: profession.name,
                        subtitle:
                            profession.roleLabel,
                        detail:
                            `${profession.skillTags.join(' / ')}\n基础攻击 ${profession.baseStats.attackPower} · 防御 ${profession.baseStats.defense}`,
                        color:
                            this.toColor(
                                profession.theme.main,
                            ),
                    }),
                );
        }

        if (this.active === 'skill') {
            return PROFESSION_CATALOG
                .slice(0, 4)
                .map(
                    (profession) => {
                        const module =
                            getProfessionSkillModule(
                                profession.id,
                            );
                        return {
                            title: profession.name,
                            subtitle:
                                `被动：${module.passive.name}`,
                            detail:
                                module.activeSkills
                                    .map(
                                        (skill) =>
                                            skill.name,
                                    )
                                    .join(' · '),
                            color:
                                this.toColor(
                                    profession.theme.main,
                                ),
                        };
                    },
                );
        }

        if (this.active === 'growth') {
            return [
                ['英雄等级', '长期培养', '大厅培养负责英雄永久成长；战斗内职业技能等级只在当前局生效。'],
                ['职业成长', '职业体系', '职业提供基础属性、攻击方式和固定技能模组。'],
                ['技能成长', '局内三选一', '被动初始 Lv.1；主动从 Lv.0 解锁，全部最高 Lv.5。'],
                ['突破规划', '后续扩展', '培养、突破、升星等永久成长继续归 HeroSystem，不写进 BattleSystem。'],
            ].map(
                ([title, subtitle, detail], index) => ({
                    title,
                    subtitle,
                    detail,
                    color:
                        this.fallbackColor(index),
                }),
            );
        }

        return [
            ['武器', '英雄装备', '攻击类装备通过 EquipmentLoadoutService 统一结算。'],
            ['防具', '英雄装备', '护甲、头盔、盾牌等提供防御与生命修正。'],
            ['饰品', '英雄装备', '戒指、项链等进入统一装备槽，不复制背包状态。'],
            ['特殊', '英雄装备', '翅膀等特殊槽位仍由同一装备服务管理。'],
        ].map(
            ([title, subtitle, detail], index) => ({
                title,
                subtitle,
                detail,
                color:
                    this.fallbackColor(index),
            }),
        );
    }

    private toColor(
        rgb:
            readonly [
                number,
                number,
                number,
            ],
    ): Color {
        return new Color(
            rgb[0],
            rgb[1],
            rgb[2],
            255,
        );
    }

    private fallbackColor(
        index: number,
    ): Color {
        const colors = [
            new Color(92, 123, 173, 255),
            new Color(171, 101, 72, 255),
            new Color(89, 145, 96, 255),
            new Color(126, 91, 157, 255),
        ];
        return colors[
            index % colors.length
        ];
    }
}
