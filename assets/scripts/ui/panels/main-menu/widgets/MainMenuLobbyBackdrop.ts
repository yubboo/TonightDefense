import {
    Color,
    Graphics,
    Node,
} from 'cc';

import {
    MainMenuUIFactory,
} from './MainMenuUIFactory';

import {
    MainMenuArt,
} from './MainMenuArt';

/**
 * 大厅背景层。
 *
 * 设计宽固定 720。
 * 高度做成 1600，长屏按宽适配时背景向上下延展，
 * 不再把整套 1280 UI 缩在屏幕中央留下黑边。
 */
export class MainMenuLobbyBackdrop {
    static readonly DESIGN_HEIGHT =
        1600;

    static create(
        parent:
            Node,
        onReady?:
            () => void,
    ): Node {
        const height =
            this.DESIGN_HEIGHT;

        const half =
            height /
            2;

        const root =
            MainMenuUIFactory.node(
                parent,
                'LobbyBackdrop',
                720,
                height,
            );

        parent.insertChild(
            root,
            0,
        );

        /**
         * 正式背景加载失败时的程序兜底。
         * 正常情况下会被 MainMenuArt 自动关闭。
         */
        const g =
            root.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                91,
                165,
                215,
                255,
            );

        g.rect(
            -360,
            -half,
            720,
            height,
        );

        g.fill();

        g.fillColor =
            new Color(
                70,
                135,
                76,
                255,
            );

        for (
            const side
            of [-1, 1]
        ) {
            for (
                let index = 0;
                index < 11;
                index += 1
            ) {
                const x =
                    side *
                    (
                        318 +
                        (index % 2) *
                        17
                    );

                const y =
                    650 -
                    index *
                    140;

                g.circle(
                    x,
                    y,
                    86,
                );

                g.fill();
            }
        }

        g.fillColor =
            new Color(
                231,
                213,
                165,
                255,
            );

        g.moveTo(
            -92,
            35,
        );

        g.lineTo(
            92,
            35,
        );

        g.lineTo(
            320,
            -half,
        );

        g.lineTo(
            -320,
            -half,
        );

        g.close();
        g.fill();

        /**
         * 这是“纯背景图”，不含动态 UI 数字，
         * 因此允许 cover 铺满。
         */
        MainMenuArt.attach(
            root,
            'background-castle',
            720,
            height,
            'cover',
            onReady,
        );

        return root;
    }
}
