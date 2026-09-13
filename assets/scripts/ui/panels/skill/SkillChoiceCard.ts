/**
 * @architecture TonightDefense V1.0
 * @owner ui
 * @module panels/skill
 *
 * 本局成长三选一卡。
 * 同一个面板同时展示“职业技能”与“全队属性”候选；
 * UI 只读取 HeroRunUpgradeOption，不保存成长状态。
 */
import {
    Color,
    Graphics,
    Label,
    Layers,
    Node,
    UITransform,
} from 'cc';

import {
    HeroRunUpgradeOption,
} from '../../../systems/hero/progression/levelup/HeroRunUpgradeService';

import {
    getProfessionById,
} from '../../../systems/hero/profession/definition/ProfessionCatalog';

import {
    AudioManager,
} from '../../../systems/audio/AudioManager';

export interface SkillChoiceCardOptions {
    parent: Node;
    option: HeroRunUpgradeOption;
    x: number;
    y: number;
    onSelect:
        (
            option: HeroRunUpgradeOption,
        ) => void;
}

export class SkillChoiceCard {
    static create(
        options: SkillChoiceCardOptions,
    ): Node {
        const {
            parent,
            option,
            x,
            y,
            onSelect,
        } = options;

        let main:
            Color;
        let soft:
            Color;
        let dark:
            Color;
        let glyph:
            string;
        let groupName:
            string;
        let kindText:
            string;
        let title:
            string;
        let levelText:
            string;
        let description:
            string;
        let actionText:
            string;
        let cardId:
            string;

        if (option.kind === 'skill') {
            const skillOption =
                option.skillOption;
            const profession =
                getProfessionById(
                    skillOption.professionId,
                );

            main = new Color(
                profession.theme.main[0],
                profession.theme.main[1],
                profession.theme.main[2],
                255,
            );
            soft = new Color(
                profession.theme.soft[0],
                profession.theme.soft[1],
                profession.theme.soft[2],
                255,
            );
            dark = new Color(
                profession.theme.dark[0],
                profession.theme.dark[1],
                profession.theme.dark[2],
                255,
            );
            glyph =
                profession.name.slice(0, 1);
            groupName =
                profession.name;
            kindText =
                skillOption.skill.kind ===
                    'passive'
                    ? '被动技能'
                    : '自动战技';
            title =
                skillOption.skill.name;
            levelText =
                skillOption.isUnlock
                    ? '解锁 · Lv.1'
                    : `Lv.${skillOption.currentLevel} → Lv.${skillOption.nextLevel}`;
            description =
                skillOption.description;
            actionText =
                skillOption.isUnlock
                    ? '解锁技能'
                    : '强化技能';
            cardId =
                `${skillOption.professionId}_${skillOption.skill.id}`;
        } else {
            main = new Color(
                62,
                134,
                191,
                255,
            );
            soft = new Color(
                220,
                237,
                248,
                255,
            );
            dark = new Color(
                43,
                82,
                112,
                255,
            );
            glyph =
                option.stat.glyph;
            groupName =
                '全队成长';
            kindText =
                '本局属性';
            title =
                option.stat.name;
            levelText =
                `Lv.${option.currentLevel} → Lv.${option.nextLevel}`;
            description =
                option.description;
            actionText =
                '强化属性';
            cardId =
                `stat_${option.stat.id}`;
        }

        const card =
            new Node(
                `RunUpgradeCard_${cardId}`,
            );
        card.layer =
            Layers.Enum.UI_2D;
        parent.addChild(card);
        card.setPosition(
            x,
            y,
            0,
        );
        card.addComponent(
            UITransform,
        ).setContentSize(
            196,
            432,
        );

        const g =
            card.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                43,
                39,
                35,
                42,
            );
        g.roundRect(
            -92,
            -211,
            192,
            421,
            25,
        );
        g.fill();

        g.fillColor =
            new Color(
                255,
                250,
                236,
                255,
            );
        g.roundRect(
            -97,
            -205,
            194,
            418,
            25,
        );
        g.fill();
        g.strokeColor =
            main;
        g.lineWidth = 4;
        g.roundRect(
            -97,
            -205,
            194,
            418,
            25,
        );
        g.stroke();

        g.fillColor = soft;
        g.roundRect(
            -82,
            55,
            164,
            130,
            18,
        );
        g.fill();

        g.fillColor = main;
        g.circle(
            0,
            121,
            38,
        );
        g.fill();
        g.fillColor =
            new Color(
                255,
                255,
                255,
                68,
            );
        g.circle(
            -10,
            133,
            18,
        );
        g.fill();

        this.createLabel(
            card,
            'UpgradeGlyph',
            glyph,
            0,
            121,
            31,
            60,
            42,
            Color.WHITE,
        );
        this.createLabel(
            card,
            'UpgradeGroup',
            groupName,
            0,
            72,
            17,
            158,
            25,
            dark,
        );
        this.createLabel(
            card,
            'UpgradeKind',
            kindText,
            0,
            38,
            14,
            154,
            22,
            main,
        );
        this.createLabel(
            card,
            'UpgradeName',
            title,
            0,
            4,
            20,
            166,
            30,
            new Color(
                47,
                44,
                41,
                255,
            ),
        );

        this.createLabel(
            card,
            'Level',
            levelText,
            0,
            -29,
            15,
            160,
            24,
            main,
        );

        this.createLabel(
            card,
            'Description',
            description,
            0,
            -91,
            13,
            158,
            88,
            new Color(
                91,
                82,
                70,
                255,
            ),
        );

        g.fillColor = main;
        g.roundRect(
            -68,
            -181,
            136,
            42,
            19,
        );
        g.fill();
        this.createLabel(
            card,
            'Action',
            actionText,
            0,
            -160,
            16,
            124,
            28,
            Color.WHITE,
        );

        card.on(
            Node.EventType.TOUCH_END,
            () => {
                AudioManager.playUi();
                onSelect(option);
            },
        );

        return card;
    }

    private static createLabel(
        parent: Node,
        name: string,
        text: string,
        x: number,
        y: number,
        fontSize: number,
        width: number,
        height: number,
        color: Color,
    ): Label {
        const node =
            new Node(name);
        node.layer =
            Layers.Enum.UI_2D;
        parent.addChild(node);
        node.setPosition(
            x,
            y,
            0,
        );
        node.addComponent(
            UITransform,
        ).setContentSize(
            width,
            height,
        );

        const label =
            node.addComponent(
                Label,
            );
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight =
            fontSize + 4;
        label.color = color;
        label.enableWrapText = true;
        return label;
    }
}
