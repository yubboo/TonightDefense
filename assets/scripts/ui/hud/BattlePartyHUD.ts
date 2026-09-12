/**
 * @architecture TonightDefense V1.0
 * @owner ui
 * @module hud
 *
 * 正式战斗底部指令区：五人卡栏 + 主角四技能入口。
 * 只读取 CharacterSystem 的当前运行状态，不复制队伍/生命数据。
 */
import {
    _decorator,
    Color,
    Component,
    Graphics,
    Label,
    Layers,
    Node,
    Sprite,
    UITransform,
} from 'cc';

import {
    CharacterDefinition,
} from '../../systems/hero/character/data/CharacterCatalog';

import {
    CompanionBattleController,
    CompanionHudSnapshot,
} from '../../systems/hero/character/companion/CompanionBattleController';

import {
    MainHeroController,
} from '../../systems/hero/character/player/MainHeroController';


import {
    HeroPortraitResolver,
} from '../panels/hero-select/HeroPortraitResolver';

import {
    BattleArt,
    BattleArtKey,
} from '../resources/BattleArt';

const { ccclass } = _decorator;

interface PartyCardView {
    root: Node;
    portrait: Sprite;
    fallbackLabel: Label;
    nameLabel: Label;
    stateLabel: Label;
    hpFill: Node;
    currentId: string;
}

interface PartyCardData {
    definition: CharacterDefinition | null;
    fallbackName: string;
    stateText: string;
    hpRatio: number;
}

export interface HeroSkillState {
    cooldownRemaining: readonly number[];
    cooldownTotal: readonly number[];
    levels: readonly number[];
    unlocked: readonly boolean[];
    names: readonly string[];
    passiveName: string;
    passiveLevel: number;
}

@ccclass('BattlePartyHUD')
export class BattlePartyHUD extends Component {
    static readonly SKILL_STATE_EVENT =
        'active-skill-state';

    private root:
        Node | null = null;

    private readonly cards:
        PartyCardView[] = [];

    private refreshTimer = 0;

    private readonly skillCooldownMasks:
        Node[] = [];

    private readonly skillCooldownLabels:
        Label[] = [];

    private readonly skillLevelLabels:
        Label[] = [];

    private skillDockTitle:
        Label | null = null;

    start(): void {
        const canvas =
            this.node.parent;

        if (!canvas) {
            console.error(
                '[今晚守城] BattlePartyHUD 找不到 Canvas',
            );
            return;
        }

        const old =
            canvas.getChildByName(
                'BattlePartyHUD',
            );

        if (old) {
            old.destroy();
        }

        const root =
            new Node(
                'BattlePartyHUD',
            );

        root.layer =
            Layers.Enum.UI_2D;
        canvas.addChild(root);

        root.addComponent(
            UITransform,
        ).setContentSize(
            720,
            1280,
        );

        this.root = root;

        this.node.on(
            BattlePartyHUD.SKILL_STATE_EVENT,
            this.onSkillState,
            this,
        );

        this.createCommandDeck(
            root,
        );
        this.createSkillDock(
            root,
        );
        this.refreshRoster();
    }

    update(dt: number): void {
        this.refreshTimer -= dt;

        if (
            this.refreshTimer > 0
        ) {
            return;
        }

        this.refreshTimer = 0.2;
        this.refreshRoster();
    }

    onDestroy(): void {
        this.node.off(
            BattlePartyHUD.SKILL_STATE_EVENT,
            this.onSkillState,
            this,
        );

        if (
            this.root?.isValid
        ) {
            this.root.destroy();
        }

        this.root = null;
        this.cards.length = 0;
        this.skillCooldownMasks.length = 0;
        this.skillCooldownLabels.length = 0;
        this.skillLevelLabels.length = 0;
        this.skillDockTitle = null;
    }

    private createCommandDeck(
        parent: Node,
    ): void {
        const deck =
            new Node(
                'PartyCommandDeck',
            );

        deck.layer =
            Layers.Enum.UI_2D;
        parent.addChild(deck);

        const g =
            deck.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                20,
                39,
                66,
                242,
            );
        g.rect(
            -360,
            -640,
            720,
            116,
        );
        g.fill();

        g.fillColor =
            new Color(
                248,
                240,
                210,
                248,
            );
        g.rect(
            -360,
            -632,
            720,
            101,
        );
        g.fill();

        g.strokeColor =
            new Color(
                191,
                151,
                57,
                255,
            );
        g.lineWidth = 4;
        g.moveTo(
            -360,
            -531,
        );
        g.lineTo(
            360,
            -531,
        );
        g.stroke();

        const xs =
            [
                -256,
                -128,
                0,
                128,
                256,
            ];

        for (
            let i = 0;
            i < xs.length;
            i += 1
        ) {
            const isHero =
                i === 2;

            this.cards.push(
                this.createPartyCard(
                    parent,
                    xs[i],
                    isHero
                        ? -575
                        : -586,
                    isHero,
                ),
            );
        }
    }

    private createPartyCard(
        parent: Node,
        x: number,
        y: number,
        isHero: boolean,
    ): PartyCardView {
        const width =
            isHero
                ? 122
                : 110;

        const height =
            isHero
                ? 116
                : 94;

        const root =
            new Node(
                isHero
                    ? 'PartyCard_MainHero'
                    : 'PartyCard_Companion',
            );

        root.layer =
            Layers.Enum.UI_2D;
        parent.addChild(root);
        root.setPosition(
            x,
            y,
            0,
        );
        root.addComponent(
            UITransform,
        ).setContentSize(
            width,
            height,
        );

        const g =
            root.addComponent(
                Graphics,
            );

        BattleArt.attach(
            root,
            'party-card-frame',
            width,
            height,
            'stretch',
        );

        g.fillColor =
            new Color(
                25,
                43,
                67,
                255,
            );
        g.roundRect(
            -width / 2,
            -height / 2,
            width,
            height,
            10,
        );
        g.fill();

        g.fillColor =
            new Color(
                241,
                230,
                195,
                255,
            );
        g.roundRect(
            -width / 2 + 4,
            -height / 2 + 4,
            width - 8,
            height - 8,
            8,
        );
        g.fill();

        g.strokeColor =
            isHero
                ? new Color(
                    244,
                    190,
                    55,
                    255,
                )
                : new Color(
                    107,
                    131,
                    164,
                    255,
                );
        g.lineWidth =
            isHero
                ? 5
                : 3;
        g.roundRect(
            -width / 2 + 2,
            -height / 2 + 2,
            width - 4,
            height - 4,
            9,
        );
        g.stroke();

        const portraitNode =
            new Node(
                'Portrait',
            );

        portraitNode.layer =
            Layers.Enum.UI_2D;
        root.addChild(
            portraitNode,
        );
        portraitNode.setPosition(
            0,
            isHero
                ? 13
                : 11,
            0,
        );
        portraitNode.addComponent(
            UITransform,
        ).setContentSize(
            width - 16,
            isHero
                ? 70
                : 54,
        );

        const portrait =
            portraitNode.addComponent(
                Sprite,
            );
        portrait.sizeMode =
            Sprite.SizeMode.CUSTOM;
        portraitNode.active = false;

        const fallbackLabel =
            this.createLabel(
                root,
                'FallbackPortrait',
                '＋',
                0,
                isHero
                    ? 15
                    : 12,
                isHero
                    ? 38
                    : 31,
                width - 18,
                new Color(
                    61,
                    91,
                    130,
                    255,
                ),
            );

        const stateLabel =
            this.createLabel(
                root,
                'State',
                isHero
                    ? '主角'
                    : '待招募',
                0,
                height / 2 - 12,
                12,
                width - 14,
                isHero
                    ? new Color(
                        143,
                        93,
                        21,
                        255,
                    )
                    : new Color(
                        90,
                        101,
                        105,
                        255,
                    ),
            );

        const nameLabel =
            this.createLabel(
                root,
                'Name',
                isHero
                    ? '主角'
                    : '空位',
                0,
                -height / 2 + 19,
                13,
                width - 12,
                new Color(
                    45,
                    49,
                    52,
                    255,
                ),
            );

        const hpTrack =
            new Node(
                'HpTrack',
            );

        hpTrack.layer =
            Layers.Enum.UI_2D;
        root.addChild(hpTrack);
        hpTrack.setPosition(
            0,
            -height / 2 + 7,
            0,
        );

        const hpWidth =
            width - 18;

        const hg =
            hpTrack.addComponent(
                Graphics,
            );
        hg.fillColor =
            new Color(
                36,
                47,
                55,
                255,
            );
        hg.roundRect(
            -hpWidth / 2,
            -4,
            hpWidth,
            8,
            4,
        );
        hg.fill();

        const hpFill =
            new Node(
                'HpFill',
            );

        hpFill.layer =
            Layers.Enum.UI_2D;
        hpTrack.addChild(
            hpFill,
        );
        hpFill.setPosition(
            -hpWidth / 2 + 2,
            0,
            0,
        );

        const hpTransform =
            hpFill.addComponent(
                UITransform,
            );
        hpTransform.setAnchorPoint(
            0,
            0.5,
        );
        hpTransform.setContentSize(
            hpWidth - 4,
            5,
        );

        const fg =
            hpFill.addComponent(
                Graphics,
            );
        fg.fillColor =
            new Color(
                79,
                190,
                103,
                255,
            );
        fg.roundRect(
            0,
            -2.5,
            hpWidth - 4,
            5,
            2.5,
        );
        fg.fill();

        return {
            root,
            portrait,
            fallbackLabel,
            nameLabel,
            stateLabel,
            hpFill,
            currentId: '',
        };
    }

    private createSkillDock(
        parent: Node,
    ): void {
        this.skillDockTitle = this.createLabel(
            parent,
            'SkillDockTitle',
            '自动战技 · 等待解锁',
            248,
            -338,
            14,
            120,
            new Color(
                243,
                223,
                168,
                255,
            ),
        );

        const specs = [
            {
                x: 148,
                y: -450,
                radius: 32,
                label: '攻',
                color:
                    new Color(
                        66,
                        142,
                        220,
                        255,
                    ),
            },
            {
                x: 221,
                y: -444,
                radius: 34,
                label: '技',
                color:
                    new Color(
                        72,
                        174,
                        211,
                        255,
                    ),
            },
            {
                x: 291,
                y: -414,
                radius: 36,
                label: '护',
                color:
                    new Color(
                        78,
                        112,
                        190,
                        255,
                    ),
            },
            {
                x: 294,
                y: -337,
                radius: 47,
                label: '绝',
                color:
                    new Color(
                        224,
                        159,
                        45,
                        255,
                    ),
            },
        ];

        const iconAssets:
            readonly BattleArtKey[] = [
                'skill-flame-bolt',
                'skill-flame-ring',
                'skill-crimson-guard',
                'skill-meteor',
            ];

        specs.forEach(
            (spec, index) => {
                const button =
                    new Node(
                        `HeroSkill_${index + 1}`,
                    );

                button.layer =
                    Layers.Enum.UI_2D;
                parent.addChild(
                    button,
                );
                button.setPosition(
                    spec.x,
                    spec.y,
                    0,
                );
                button.addComponent(
                    UITransform,
                ).setContentSize(
                    spec.radius * 2.2,
                    spec.radius * 2.2,
                );

                const g =
                    button.addComponent(
                        Graphics,
                    );
                g.fillColor =
                    new Color(
                        16,
                        34,
                        61,
                        235,
                    );
                g.circle(
                    0,
                    0,
                    spec.radius + 5,
                );
                g.fill();

                g.fillColor =
                    spec.color;
                g.circle(
                    0,
                    0,
                    spec.radius,
                );
                g.fill();

                g.fillColor =
                    new Color(
                        255,
                        255,
                        255,
                        38,
                    );
                g.circle(
                    -spec.radius * 0.2,
                    spec.radius * 0.25,
                    spec.radius * 0.58,
                );
                g.fill();

                g.strokeColor =
                    new Color(
                        245,
                        215,
                        139,
                        255,
                    );
                g.lineWidth = 3;
                g.circle(
                    0,
                    0,
                    spec.radius,
                );
                g.stroke();

                const fallbackIcon = this.createLabel(
                    button,
                    'Icon',
                    spec.label,
                    0,
                    1,
                    Math.round(
                        spec.radius * 0.75,
                    ),
                    spec.radius * 1.5,
                    new Color(
                        255,
                        250,
                        227,
                        255,
                    ),
                );

                const iconHolder =
                    new Node('SkillIconSprite');

                iconHolder.layer =
                    Layers.Enum.UI_2D;
                button.addChild(iconHolder);
                iconHolder.addComponent(
                    UITransform,
                ).setContentSize(
                    spec.radius * 1.6,
                    spec.radius * 1.6,
                );

                BattleArt.attach(
                    iconHolder,
                    iconAssets[index],
                    spec.radius * 1.6,
                    spec.radius * 1.6,
                    'cover',
                    () => {
                        fallbackIcon.node.active = false;
                    },
                );

                const cooldownMask =
                    new Node('CooldownMask');

                cooldownMask.layer =
                    Layers.Enum.UI_2D;
                button.addChild(cooldownMask);
                cooldownMask.addComponent(
                    UITransform,
                ).setContentSize(
                    spec.radius * 1.8,
                    spec.radius * 1.8,
                );

                const maskGraphics =
                    cooldownMask.addComponent(Graphics);
                maskGraphics.fillColor =
                    new Color(7, 14, 28, 185);
                maskGraphics.circle(
                    0,
                    0,
                    spec.radius,
                );
                maskGraphics.fill();

                const cooldownLabel =
                    this.createLabel(
                        cooldownMask,
                        'CooldownText',
                        '',
                        0,
                        0,
                        Math.max(18, spec.radius * 0.7),
                        spec.radius * 1.5,
                        new Color(255, 247, 220, 255),
                    );

                cooldownMask.active = true;
                cooldownLabel.string = '锁';
                this.skillCooldownMasks.push(cooldownMask);
                this.skillCooldownLabels.push(cooldownLabel);

                const levelLabel =
                    this.createLabel(
                        button,
                        'SkillLevel',
                        'Lv.0',
                        0,
                        -spec.radius - 11,
                        11,
                        spec.radius * 1.8,
                        new Color(
                            244,
                            222,
                            168,
                            255,
                        ),
                    );

                this.skillLevelLabels.push(levelLabel);

                /* 主动技能由 SkillRuntime 自动施放；按钮仅显示状态。 */
            },
        );
    }

    private onSkillState(
        state: HeroSkillState,
    ): void {
        if (this.skillDockTitle) {
            this.skillDockTitle.string =
                `被动：${state.passiveName} Lv.${state.passiveLevel} · 自动施放`;
        }

        for (
            let i = 0;
            i < this.skillCooldownMasks.length;
            i += 1
        ) {
            const unlocked =
                state.unlocked[i] ?? false;
            const level =
                state.levels[i] ?? 0;
            const remaining =
                state.cooldownRemaining[i] ?? 0;

            if (this.skillLevelLabels[i]) {
                this.skillLevelLabels[i].string =
                    unlocked
                        ? `Lv.${level}`
                        : '未解锁';
            }

            if (!unlocked) {
                this.skillCooldownMasks[i].active = true;
                this.skillCooldownLabels[i].string = '锁';
                continue;
            }

            const cooling =
                remaining > 0.05;

            this.skillCooldownMasks[i].active = cooling;
            this.skillCooldownLabels[i].string =
                cooling
                    ? remaining.toFixed(
                        remaining < 10 ? 1 : 0,
                    )
                    : '';
        }
    }

    private refreshRoster(): void {
        if (
            this.cards.length !== 5
        ) {
            return;
        }

        const hero =
            MainHeroController
                .instance;

        const heroCombatant =
            hero?.combatant;

        const heroData:
            PartyCardData = {
                definition:
                    hero
                        ?.selectedCharacter ??
                    null,
                fallbackName:
                    '主角',
                stateText:
                    heroCombatant
                        ?.isAlive === false
                        ? '阵亡'
                        : '主角',
                hpRatio:
                    heroCombatant
                        ? heroCombatant
                            .currentHp /
                            Math.max(
                                1,
                                heroCombatant
                                    .maxHp,
                            )
                        : 0,
            };

        const companions =
            CompanionBattleController
                .instance
                ?.getHudRoster() ??
            [];

        const makeCompanion =
            (
                index: number,
            ):
                PartyCardData => {
                const entry:
                    CompanionHudSnapshot | undefined =
                    companions[index];

                if (!entry) {
                    return {
                        definition: null,
                        fallbackName:
                            `伙伴${index + 1}`,
                        stateText:
                            '待招募',
                        hpRatio: 0,
                    };
                }

                return {
                    definition:
                        entry.definition,
                    fallbackName:
                        `伙伴${index + 1}`,
                    stateText:
                        entry.isReviving
                            ? '复活中'
                            : entry.isAlive
                                ? `伙伴${index + 1}`
                                : '阵亡',
                    hpRatio:
                        entry.currentHp /
                        Math.max(
                            1,
                            entry.maxHp,
                        ),
                };
            };

        const ordered = [
            makeCompanion(0),
            makeCompanion(1),
            heroData,
            makeCompanion(2),
            makeCompanion(3),
        ];

        ordered.forEach(
            (data, index) => {
                this.refreshCard(
                    this.cards[index],
                    data,
                );
            },
        );
    }

    private refreshCard(
        card: PartyCardView,
        data: PartyCardData,
    ): void {
        const definition =
            data.definition;

        card.nameLabel.string =
            definition
                ?.name ??
            data.fallbackName;

        card.stateLabel.string =
            data.stateText;

        card.hpFill.setScale(
            Math.max(
                0,
                Math.min(
                    1,
                    data.hpRatio,
                ),
            ),
            1,
            1,
        );

        const id =
            definition?.id ?? '';

        if (
            card.currentId === id
        ) {
            return;
        }

        card.currentId = id;
        card.portrait.node.active =
            false;
        card.portrait.spriteFrame =
            null;

        card.fallbackLabel.string =
            definition
                ?.name
                .slice(0, 1) ??
            '＋';
        card.fallbackLabel.node.active =
            true;

        if (!definition) {
            return;
        }

        void this.loadPortrait(
            card,
            definition,
        );
    }

    private async loadPortrait(
        card: PartyCardView,
        definition:
            CharacterDefinition,
    ): Promise<void> {
        const frame =
            await HeroPortraitResolver
                .resolve(
                    definition,
                );

        if (
            !frame ||
            !card.root.isValid ||
            card.currentId !==
                definition.id
        ) {
            return;
        }

        card.portrait.spriteFrame =
            frame;
        card.portrait.node.active =
            true;
        card.fallbackLabel.node.active =
            false;
    }

    private createLabel(
        parent: Node,
        name: string,
        text: string,
        x: number,
        y: number,
        fontSize: number,
        width: number,
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
            fontSize + 8,
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

        return label;
    }
}
