/**
 * @architecture TonightDefense V1.0
 * @owner character
 * @module stats
 */
import {
    _decorator,
    Color,
    Component,
    Graphics,
    Layers,
    Node,
    UITransform,
} from 'cc';

import {
    CombatEventBus,
    CombatSource,
} from '../../../battle/combat/CombatEventBus';

const { ccclass } = _decorator;

export interface CharacterCombatStats {
    maxHp: number;
    attackPower: number;
    defense: number;
    moveSpeed: number;
    hpBarY?: number;
    hpBarWidth?: number;
}

export type CharacterDeathHandler =
    () => void;

export interface CharacterCombatModifier {
    attackMultiplier?: number;
    defenseFlat?: number;
    moveSpeedMultiplier?: number;
    attackSpeedMultiplier?: number;
    damageReduction?: number;
    healingReceivedMultiplier?: number;
}

@ccclass('CharacterCombatant')
export class CharacterCombatant extends Component {
    private maxHpValue = 100;
    private hpValue = 100;
    private attackValue = 10;
    private defenseValue = 0;
    private moveSpeedValue = 100;
    private shieldValue = 0;

    private readonly modifiers =
        new Map<string, CharacterCombatModifier>();

    private deathHandler:
        CharacterDeathHandler | null = null;

    private hpFill: Node | null = null;

    setup(
        stats: CharacterCombatStats,
        onDeath?: CharacterDeathHandler,
    ): void {
        this.maxHpValue = Math.max(
            1,
            Math.floor(stats.maxHp),
        );

        this.hpValue =
            this.maxHpValue;

        this.shieldValue = 0;
        this.modifiers.clear();

        this.attackValue =
            Math.max(0, stats.attackPower);

        this.defenseValue =
            Math.max(0, stats.defense);

        this.moveSpeedValue =
            Math.max(1, stats.moveSpeed);

        this.deathHandler =
            onDeath ?? null;

        this.createHpBar(
            stats.hpBarY ?? 64,
            stats.hpBarWidth ?? 60,
        );

        this.refreshHpBar();
    }

    takeDamage(
        rawDamage: number,
        source?: CombatSource,
    ): number {
        if (!this.isAlive) {
            return 0;
        }

        const raw =
            Math.max(0, rawDamage);

        const afterDefense =
            Math.max(
                0,
                raw - this.defense,
            );

        const actualDamage =
            raw <= 0
                ? 0
                : Math.max(
                    1,
                    Math.round(
                        afterDefense *
                        (1 - this.damageReduction),
                    ),
                );

        const absorbed =
            Math.min(
                this.shieldValue,
                actualDamage,
            );

        this.shieldValue =
            Math.max(
                0,
                this.shieldValue - absorbed,
            );

        const hpBefore =
            this.hpValue;

        const hpDamage =
            Math.max(
                0,
                actualDamage - absorbed,
            );

        this.hpValue =
            Math.max(
                0,
                this.hpValue - hpDamage,
            );

        this.refreshHpBar();

        if (actualDamage > 0) {
            CombatEventBus.emitHeroDamaged({
                targetNode: this.node,
                requestedDamage: raw,
                actualDamage,
                hpDamage:
                    Math.min(
                        hpBefore,
                        hpDamage,
                    ),
                shieldAbsorbed: absorbed,
                currentHp: this.hpValue,
                maxHp: this.maxHpValue,
                source,
            });
        }

        if (this.hpValue <= 0) {
            /**
             * 先进入死亡不可见态，再通知外层。
             * 这样伙伴死亡回调若立即启动“持续复活”，可以安全地重新激活节点，
             * 不会在回调返回后又被这里二次设回 inactive。
             */
            this.node.active = false;
            this.deathHandler?.();
        }

        return actualDamage;
    }

    heal(
        amount: number,
    ): void {
        if (!this.isAlive) {
            return;
        }

        const effectiveHeal =
            Math.max(0, amount) *
            this.healingReceivedMultiplier;

        this.hpValue =
            Math.min(
                this.maxHpValue,
                this.hpValue +
                    effectiveHeal,
            );

        this.refreshHpBar();
    }

    addShield(
        amount: number,
    ): void {
        if (!this.isAlive) {
            return;
        }

        this.shieldValue =
            Math.min(
                this.maxHpValue,
                this.shieldValue +
                    Math.max(0, amount),
            );
    }

    /**
     * 复活通道开始：角色重新显示，但在外层 revive 状态结束前不应加入战斗目标表。
     */
    beginRevive(
        hpRatio = 0.04,
    ): void {
        this.setReviveProgress(
            hpRatio,
        );
    }

    /**
     * 按复活进度直接恢复到对应生命比例。
     * 这是“雕像持续传输能量 -> 伙伴血量持续增长”的唯一生命写入入口。
     */
    setReviveProgress(
        hpRatio: number,
    ): void {
        const ratio =
            Math.max(
                0.01,
                Math.min(
                    1,
                    hpRatio,
                ),
            );

        this.hpValue =
            Math.max(
                1,
                Math.round(
                    this.maxHpValue *
                    ratio,
                ),
            );

        this.node.active = true;
        this.refreshHpBar();
    }

    /**
     * 雕像在复活中途损坏时取消本次复活，不重复触发死亡回调。
     */
    cancelRevive(): void {
        this.hpValue = 0;
        this.refreshHpBar();
        this.node.active = false;
    }

    revive(
        hpRatio = 0.65,
    ): void {
        this.setReviveProgress(
            hpRatio,
        );
    }

    get currentHp(): number {
        return this.hpValue;
    }

    get maxHp(): number {
        return this.maxHpValue;
    }

    get isAlive(): boolean {
        return this.hpValue > 0;
    }

    get shield(): number {
        return this.shieldValue;
    }

    get attackPower(): number {
        let multiplier = 1;

        for (const modifier of this.modifiers.values()) {
            multiplier *=
                Math.max(
                    0,
                    modifier.attackMultiplier ?? 1,
                );
        }

        return Math.max(
            0,
            this.attackValue * multiplier,
        );
    }

    get defense(): number {
        let bonus = 0;

        for (const modifier of this.modifiers.values()) {
            bonus += modifier.defenseFlat ?? 0;
        }

        return Math.max(
            0,
            this.defenseValue + bonus,
        );
    }

    get moveSpeed(): number {
        let multiplier = 1;

        for (const modifier of this.modifiers.values()) {
            multiplier *=
                Math.max(
                    0.1,
                    modifier.moveSpeedMultiplier ?? 1,
                );
        }

        return Math.max(
            1,
            this.moveSpeedValue * multiplier,
        );
    }

    get attackSpeedMultiplier(): number {
        let multiplier = 1;

        for (const modifier of this.modifiers.values()) {
            multiplier *=
                Math.max(
                    0.1,
                    modifier.attackSpeedMultiplier ?? 1,
                );
        }

        return multiplier;
    }

    get damageReduction(): number {
        let reduction = 0;

        for (const modifier of this.modifiers.values()) {
            reduction +=
                Math.max(
                    0,
                    modifier.damageReduction ?? 0,
                );
        }

        return Math.max(
            0,
            Math.min(0.80, reduction),
        );
    }

    get healingReceivedMultiplier(): number {
        let multiplier = 1;

        for (const modifier of this.modifiers.values()) {
            multiplier *=
                Math.max(
                    0,
                    modifier.healingReceivedMultiplier ?? 1,
                );
        }

        return multiplier;
    }

    setModifier(
        id: string,
        modifier: CharacterCombatModifier,
    ): void {
        this.modifiers.set(
            id,
            { ...modifier },
        );
    }

    removeModifier(
        id: string,
    ): void {
        this.modifiers.delete(id);
    }

    clearRuntimeModifiers(): void {
        this.modifiers.clear();
    }

    /**
     * SkillSystem 通过这个公开接口强化角色，
     * 不直接修改 CharacterCombatant 内部字段。
     */
    applyUpgrade(
        kind:
            | 'attack_percent'
            | 'defense_flat'
            | 'max_hp_percent'
            | 'move_speed_percent',
        value: number,
    ): void {
        switch (kind) {
            case 'attack_percent':
                this.attackValue =
                    Math.max(
                        1,
                        this.attackValue *
                            (
                                1 +
                                Math.max(
                                    0,
                                    value,
                                )
                            ),
                    );
                break;

            case 'defense_flat':
                this.defenseValue =
                    Math.max(
                        0,
                        this.defenseValue +
                            value,
                    );
                break;

            case 'max_hp_percent': {
                const oldMax =
                    this.maxHpValue;

                this.maxHpValue =
                    Math.max(
                        oldMax + 1,
                        Math.round(
                            oldMax *
                                (
                                    1 +
                                    Math.max(
                                        0,
                                        value,
                                    )
                                ),
                        ),
                    );

                /**
                 * 最大生命增加多少，就同步恢复多少，
                 * 避免“升级生命上限但当前血量不动”显得吃亏。
                 */
                this.hpValue =
                    Math.min(
                        this.maxHpValue,
                        this.hpValue +
                            (
                                this.maxHpValue -
                                oldMax
                            ),
                    );

                this.refreshHpBar();
                break;
            }

            case 'move_speed_percent':
                this.moveSpeedValue =
                    Math.max(
                        1,
                        this.moveSpeedValue *
                            (
                                1 +
                                Math.max(
                                    0,
                                    value,
                                )
                            ),
                    );
                break;
        }
    }

    private createHpBar(
        y: number,
        width: number,
    ): void {
        const old =
            this.node.getChildByName(
                'CharacterHpBar',
            );

        if (old) {
            old.destroy();
        }

        const root =
            new Node('CharacterHpBar');

        root.layer =
            Layers.Enum.UI_2D;

        this.node.addChild(root);

        root.setPosition(
            0,
            y,
            0,
        );

        root.addComponent(
            UITransform,
        ).setContentSize(
            width,
            12,
        );

        const bg =
            new Node('Bg');

        bg.layer =
            Layers.Enum.UI_2D;

        root.addChild(bg);

        bg.addComponent(
            UITransform,
        ).setContentSize(
            width,
            8,
        );

        const bgGraphics =
            bg.addComponent(Graphics);

        bgGraphics.fillColor =
            new Color(
                40,
                42,
                48,
                220,
            );

        bgGraphics.roundRect(
            -width / 2,
            -4,
            width,
            8,
            4,
        );

        bgGraphics.fill();

        const fill =
            new Node('Fill');

        fill.layer =
            Layers.Enum.UI_2D;

        root.addChild(fill);

        const fillTransform =
            fill.addComponent(
                UITransform,
            );

        fillTransform.setAnchorPoint(
            0,
            0.5,
        );

        fillTransform.setContentSize(
            width - 4,
            4,
        );

        fill.setPosition(
            -width / 2 + 2,
            0,
            0,
        );

        const fillGraphics =
            fill.addComponent(
                Graphics,
            );

        fillGraphics.fillColor =
            new Color(
                82,
                210,
                112,
                255,
            );

        fillGraphics.roundRect(
            0,
            -2,
            width - 4,
            4,
            2,
        );

        fillGraphics.fill();

        this.hpFill = fill;
    }

    private refreshHpBar(): void {
        if (!this.hpFill) {
            return;
        }

        const ratio =
            this.maxHpValue <= 0
                ? 0
                : Math.max(
                    0,
                    Math.min(
                        1,
                        this.hpValue /
                        this.maxHpValue,
                    ),
                );

        this.hpFill.setScale(
            ratio,
            1,
            1,
        );
    }
}
