import {
    Color,
    Graphics,
    Node,
} from 'cc';

import { MainMenuIcons } from '../widgets/MainMenuIcons';
import { MainMenuTheme } from '../widgets/MainMenuTheme';
import { MainMenuUIFactory } from '../widgets/MainMenuUIFactory';
import { MainMenuArt } from '../widgets/MainMenuArt';

type HeroSection =
    | 'main'
    | 'companion'
    | 'profession'
    | 'training';

export class MainMenuHeroPage {
    private readonly root: Node;

    private active: HeroSection = 'main';

    constructor(parent: Node) {
        this.root = MainMenuUIFactory.node(
            parent,
            'HeroPage',
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
            'HeroPanel',
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
            'hero',
            -258,
            0,
            46,
            MainMenuTheme.white,
        );

        MainMenuUIFactory.label(
            title,
            'Title',
            '英雄',
            -158,
            0,
            30,
            140,
            MainMenuTheme.white,
        );

        this.createTabs(panel);
        this.createCards(panel);
    }

    private createTabs(panel: Node): void {
        const configs = [
            ['main', '主角'],
            ['companion', '伙伴'],
            ['profession', '职业'],
            ['training', '培养'],
        ] as const;

        const xs = [-219, -73, 73, 219];

        configs.forEach(([id, text], index) => {
            const active = id === this.active;

            const tab = MainMenuUIFactory.roundedBox(
                panel,
                `Tab_${id}`,
                136,
                52,
                xs[index],
                370,
                active
                    ? new Color(255, 205, 80, 255)
                    : new Color(61, 66, 63, 255),
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
                18,
                106,
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
    }

    private createCards(panel: Node): void {
        const names =
            this.active === 'main'
                ? ['元素法师', '圣骑士', '游侠', '影刺']
                : this.active === 'companion'
                    ? ['魅影术士', '守护祭司', '皇家骑士', '游侠']
                    : this.active === 'profession'
                        ? ['剑修', '法师', '游侠', '守护']
                        : ['等级', '属性', '技能', '成长'];

        const colors = [
            new Color(102, 67, 144, 255),
            new Color(107, 122, 132, 255),
            new Color(73, 125, 87, 255),
            new Color(56, 65, 72, 255),
        ];

        names.forEach((name, index) => {
            const x = -216 + index * 144;

            const card = MainMenuUIFactory.roundedBox(
                panel,
                `HeroCard_${index}`,
                132,
                315,
                x,
                105,
                new Color(236, 232, 219, 255),
                MainMenuTheme.ink,
                5,
                4,
                true,
            );

            const portrait = MainMenuUIFactory.roundedBox(
                card,
                'Portrait',
                112,
                160,
                0,
                56,
                colors[index],
                MainMenuTheme.ink,
                3,
                3,
            );

            const pg = portrait.getComponent(Graphics)!;

            pg.fillColor = new Color(230, 226, 215, 255);
            pg.circle(0, 35, 24);
            pg.fill();

            pg.roundRect(-31, -52, 62, 72, 16);
            pg.fill();

            if (index === 0) {
                pg.fillColor = new Color(44, 31, 76, 255);
                pg.moveTo(-47, 54);
                pg.lineTo(0, 112);
                pg.lineTo(38, 55);
                pg.close();
                pg.fill();

                pg.roundRect(-52, 49, 104, 14, 7);
                pg.fill();
            }

            MainMenuUIFactory.label(
                card,
                'Level',
                index === 0
                    ? 'Lv.15'
                    : `Lv.${10 - index}`,
                -33,
                -41,
                17,
                65,
                new Color(255, 210, 78, 255),
            );

            MainMenuUIFactory.label(
                card,
                'Name',
                name,
                0,
                -76,
                17,
                114,
            );

            const bar = MainMenuUIFactory.node(
                card,
                'Progress',
                104,
                22,
                0,
                -112,
            );

            const bg = bar.addComponent(Graphics);

            bg.fillColor = new Color(52, 56, 54, 255);
            bg.rect(-52, -6, 104, 12);
            bg.fill();

            bg.fillColor = new Color(68, 192, 221, 255);
            bg.rect(-52, -6, 24 + index * 16, 12);
            bg.fill();

            MainMenuUIFactory.label(
                card,
                'State',
                index === 0
                    ? '已出战'
                    : '可培养',
                0,
                -137,
                13,
                94,
                index === 0
                    ? new Color(138, 98, 24, 255)
                    : MainMenuTheme.inkSoft,
            );
        });

        MainMenuUIFactory.label(
            panel,
            'FooterHint',
            '英雄系统：主角 / 伙伴 / 职业 / 人物培养',
            0,
            -335,
            15,
            500,
            MainMenuTheme.inkSoft,
        );
    }
}
