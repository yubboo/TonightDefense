/**
 * @architecture TonightDefense V1.0
 * @owner ui
 * @module panels/skill
 *
 * 职业技能强化卡。
 * 卡片展示职业、技能类型、当前/下一等级和本级效果；
 * 技能等级事实来源始终是 ProfessionSkillRunState。
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
    HeroSkillChoiceOption,
} from '../../../systems/hero/skill/upgrade/HeroSkillUpgradeService';

import {
    getProfessionById,
} from '../../../systems/hero/profession/definition/ProfessionCatalog';

import {
    AudioManager,
} from '../../../systems/audio/AudioManager';

export interface SkillChoiceCardOptions {
    parent: Node;
    option: HeroSkillChoiceOption;
    x: number;
    y: number;
    onSelect:
        (
            option: HeroSkillChoiceOption,
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

        const profession =
            getProfessionById(
                option.professionId,
            );
        const main =
            new Color(
                profession.theme.main[0],
                profession.theme.main[1],
                profession.theme.main[2],
                255,
            );
        const soft =
            new Color(
                profession.theme.soft[0],
                profession.theme.soft[1],
                profession.theme.soft[2],
                255,
            );
        const dark =
            new Color(
                profession.theme.dark[0],
                profession.theme.dark[1],
                profession.theme.dark[2],
                255,
            );

        const card =
            new Node(
                `SkillCard_${option.professionId}_${option.skill.id}`,
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

        /** 职业徽记：避免技能选择继续依赖某一名英雄头像。 */
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
            'ProfessionGlyph',
            profession.name.slice(0, 1),
            0,
            121,
            31,
            60,
            42,
            Color.WHITE,
        );
        this.createLabel(
            card,
            'ProfessionName',
            profession.name,
            0,
            72,
            17,
            158,
            25,
            dark,
        );
        this.createLabel(
            card,
            'SkillKind',
            option.skill.kind === 'passive'
                ? '被动技能'
                : '自动战技',
            0,
            38,
            14,
            154,
            22,
            main,
        );
        this.createLabel(
            card,
            'SkillName',
            option.skill.name,
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

        const levelText =
            option.isUnlock
                ? '解锁 · Lv.1'
                : `Lv.${option.currentLevel} → Lv.${option.nextLevel}`;
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
            option.description,
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
            option.isUnlock
                ? '解锁技能'
                : '强化技能',
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
