/**
 * @architecture TonightDefense V1.0
 * @owner character
 * @module player
 *
 * 所有可上场人物都属于统一 Hero / CharacterSystem。
 *
 * 开局三选一后，被选中的英雄使用同一套
 * CharacterDefinition + ProfessionDefinition 战斗数据，
 * 这里只额外负责“玩家摇杆控制”这一种控制模式。
 */
import {
    _decorator,
    Component,
    Layers,
    Node,
    UITransform,
    Vec2,
} from 'cc';

import {
    MoveInputState,
} from '../../../ui/input/MoveInputState';

import {
    CharacterCombatant,
} from '../stats/CharacterCombatant';

import {
    BattleTargetRegistry,
} from '../../battle/targeting/BattleTargetRegistry';

import {
    CharacterDefinition,
} from '../data/CharacterCatalog';

import {
    HeroSelectionState,
} from '../selection/HeroSelectionState';

import {
    getProfessionById,
} from '../../profession/definition/ProfessionCatalog';

import {
    ProfessionDefinition,
} from '../../profession/definition/ProfessionTypes';

import {
    HeroBattleVisualFactory,
    HeroBattleVisualHandle,
} from '../visual/HeroBattleVisualFactory';

import {
    BATTLE_LAYOUT,
} from '../../battle/data/BattleLayoutConfig';

import {
    BattleWorldService,
} from '../../battle/view/BattleWorldService';

import {
    EquipmentLoadoutService,
} from '../../inventory/equipment/EquipmentLoadoutService';

const {
    ccclass,
    property,
} = _decorator;

@ccclass('MainHeroController')
export class MainHeroController
extends Component {
    static instance:
        MainHeroController | null =
        null;

    /**
     * 这些属性只作为“无职业数据时”的安全回退值。
     * 正常游戏使用 ProfessionSystem 中的数值。
     */
    @property
    moveSpeed = 155;

    @property
    maxHp = 260;

    @property
    attackPower = 12;

    @property
    defense = 4;

    @property
    minX = -290;

    @property
    maxX = 290;

    @property
    minY = -360;

    @property
    maxY = 340;

    /**
     * 只在移动状态/左右朝向真的变化时通知视觉层。
     * 避免微信端每帧重复 setScale 导致 UI Transform 持续脏标记。
     */
    private visualMoving = false;

    private visualFacing = 0;

    private heroNode:
        Node | null = null;

    private visualHandle:
        HeroBattleVisualHandle | null =
        null;

    private combatantValue:
        CharacterCombatant | null =
        null;

    private selectedCharacterValue:
        CharacterDefinition | null =
        null;

    private selectedProfessionValue:
        ProfessionDefinition | null =
        null;

    onLoad(): void {
        MainHeroController.instance =
            this;

        /**
         * 战场移动范围由 BattleLayoutConfig 统一维护。
         * 这里同步到 Inspector 字段，兼容旧场景序列化值，但不让旧值继续成为权威。
         */
        this.minX =
            BATTLE_LAYOUT
                .heroMoveBounds
                .minX;
        this.maxX =
            BATTLE_LAYOUT
                .heroMoveBounds
                .maxX;
        this.minY =
            BATTLE_LAYOUT
                .heroMoveBounds
                .minY;
        this.maxY =
            BATTLE_LAYOUT
                .heroMoveBounds
                .maxY;
    }

    start(): void {
        const selected =
            HeroSelectionState.current;

        if (selected) {
            this.spawnSelectedHero(
                selected,
            );

            return;
        }

        console.log(
            '[今晚守城] MainHeroController 等待开局主角三选一',
        );
    }

    onDestroy(): void {
        BattleTargetRegistry.unregister(
            'main-hero',
        );

        if (
            MainHeroController.instance ===
            this
        ) {
            MainHeroController.instance =
                null;
        }
    }

    update(
        dt: number,
    ): void {
        if (
            !this.heroNode ||
            !this.combatantValue
                ?.isAlive
        ) {
            this.updateVisualMovement(
                0,
                0,
            );
            return;
        }

        const inputDirection =
            MoveInputState.direction;

        let inputX =
            inputDirection.x;

        let inputY =
            inputDirection.y;

        let inputLengthSq =
            inputX * inputX +
            inputY * inputY;

        if (
            inputLengthSq > 1
        ) {
            const invLength =
                1 /
                Math.sqrt(
                    inputLengthSq,
                );

            inputX *= invLength;
            inputY *= invLength;
            inputLengthSq = 1;
        }

        this.updateVisualMovement(
            inputX,
            inputY,
        );

        if (
            inputLengthSq <=
            0.0001
        ) {
            return;
        }

        /**
         * 角色位置直接跟随当前摇杆，不再做二次速度平滑。
         * 摇杆本身已经做死区和每帧采样，再做指数平滑会让微信端
         * 产生“拖一下才走 / 松手还滑 / 方向切换有顿挫”的体感。
         *
         * 只对极端长帧做 1/30 秒上限，避免开发者工具偶发卡顿后
         * 一帧跨出很远，看起来像瞬移。
         */
        const safeDt =
            Math.max(
                0,
                Math.min(
                    dt,
                    1 / 30,
                ),
            );

        const speed =
            this.combatantValue
                .moveSpeed;

        const pos =
            this.heroNode.position;

        const rawNextX =
            pos.x +
            inputX *
                speed *
                safeDt;

        const rawNextY =
            pos.y +
            inputY *
                speed *
                safeDt;

        /**
         * v0.4.8 无边界地图：主角不再被旧的矩形战场 clamp。
         * 有限地图配置仍保留，方便以后切回关卡型地图时复用。
         */
        const nextX =
            BATTLE_LAYOUT.map.infinite
                ? rawNextX
                : Math.max(
                    this.minX,
                    Math.min(
                        this.maxX,
                        rawNextX,
                    ),
                );

        const nextY =
            BATTLE_LAYOUT.map.infinite
                ? rawNextY
                : Math.max(
                    this.minY,
                    Math.min(
                        this.maxY,
                        rawNextY,
                    ),
                );

        this.heroNode.setPosition(
            nextX,
            nextY,
            0,
        );
    }

    private updateVisualMovement(
        x: number,
        y: number,
    ): void {
        const lengthSq =
            x * x + y * y;

        const moving =
            lengthSq > 0.01;

        let facing =
            this.visualFacing;

        if (
            Math.abs(x) >
                Math.abs(y) &&
            Math.abs(x) > 0.05
        ) {
            facing =
                x < 0
                    ? -1
                    : 1;
        }

        if (
            moving ===
                this.visualMoving &&
            facing ===
                this.visualFacing
        ) {
            return;
        }

        this.visualMoving =
            moving;

        this.visualFacing =
            facing;

        this.visualHandle
            ?.setMoveDirection(
                MoveInputState.direction,
            );
    }

    get targetNode():
        Node | null {
        return this.heroNode;
    }

    get combatant():
        CharacterCombatant | null {
        return this.combatantValue;
    }

    get selectedCharacter():
        CharacterDefinition | null {
        return this.selectedCharacterValue;
    }

    get selectedProfession():
        ProfessionDefinition | null {
        return this.selectedProfessionValue;
    }

    /**
     * PreBattleHeroSelectionController 的公开入口。
     */
    spawnSelectedHero(
        character:
            CharacterDefinition,
    ): void {
        const canvas =
            this.node.parent;

        if (!canvas) {
            console.error(
                '[今晚守城] MainHeroController 找不到 Canvas',
            );
            return;
        }

        const profession =
            getProfessionById(
                character.professionId,
            );

        BattleTargetRegistry.unregister(
            'main-hero',
        );

        const worldRoot =
            BattleWorldService.ensure(
                canvas,
            );

        const old =
            worldRoot.getChildByName(
                'MainHero',
            );

        if (old) {
            old.destroy();
        }

        /**
         * 兼容热重载前直接挂在 Canvas 下的旧节点。
         */
        const legacyOld =
            canvas.getChildByName(
                'MainHero',
            );

        if (legacyOld) {
            legacyOld.destroy();
        }

        const hero =
            new Node(
                'MainHero',
            );

        hero.layer =
            Layers.Enum.UI_2D;

        worldRoot.addChild(hero);

        hero.setPosition(
            BATTLE_LAYOUT
                .heroSpawn.x,
            BATTLE_LAYOUT
                .heroSpawn.y,
            0,
        );

        hero.addComponent(
            UITransform,
        ).setContentSize(
            100,
            120,
        );

        const stats =
            profession.baseStats;

        EquipmentLoadoutService
            .ensureOwnedEquipmentEquipped();

        const equipment =
            EquipmentLoadoutService
                .getCombatModifiers();

        const combatant =
            hero.addComponent(
                CharacterCombatant,
            );

        combatant.setup(
            {
                maxHp:
                    Math.round(
                        stats.maxHp *
                        (1 + equipment.maxHpPercent),
                    ),

                attackPower:
                    stats.attackPower +
                    equipment.attackFlat,

                defense:
                    stats.defense +
                    equipment.defenseFlat,

                moveSpeed:
                    stats.moveSpeed *
                    (1 + equipment.moveSpeedPercent),

                hpBarY: 70,
                hpBarWidth: 66,
            },
            () => {
                console.log(
                    `[今晚守城] 主角 ${character.name} 阵亡`,
                );
            },
        );

        BattleTargetRegistry.register(
            {
                id:
                    'main-hero',

                kind:
                    'hero',

                controlMode:
                    'player',

                node:
                    hero,

                isAlive:
                    () =>
                        combatant.isAlive,

                takeDamage:
                    (
                        amount,
                    ) =>
                        combatant.takeDamage(
                            amount,
                        ),
            },
        );

        this.heroNode =
            hero;

        this.visualMoving = false;
        this.visualFacing = 0;

        this.combatantValue =
            combatant;

        this.selectedCharacterValue =
            character;

        this.selectedProfessionValue =
            profession;

        this.visualHandle =
            null;

        void this.attachBattleVisual(
            hero,
            character,
            profession,
        );

        console.log(
            `[今晚守城] 主角已创建：${character.name} / ${profession.name} / HP=${stats.maxHp} / 攻击=${stats.attackPower} / 防御=${stats.defense} / 速度=${stats.moveSpeed}`,
        );
    }


    /**
     * AutoAttackController 调用，
     * 让主角视觉播放职业攻击动作。
     */
    playAttackAnimation(): void {
        this.visualHandle
            ?.playAttack();
    }

    private async attachBattleVisual(
        hero:
            Node,
        character:
            CharacterDefinition,
        profession:
            ProfessionDefinition,
    ): Promise<void> {
        try {
            const handle =
                await HeroBattleVisualFactory
                    .build(
                        hero,
                        character,
                        profession,
                    );

            /**
             * 异步资源完成时，如果玩家已经换了主角/节点被销毁，
             * 不再把旧视觉挂回来。
             */
            if (
                !hero.isValid ||
                this.heroNode !== hero ||
                this.selectedCharacterValue
                    ?.id !==
                    character.id
            ) {
                if (
                    handle.root.isValid
                ) {
                    handle.root.destroy();
                }

                return;
            }

            this.visualHandle =
                handle;

            /**
             * 视觉是异步创建的，创建完成后主动同步一次当前移动状态。
             */
            this.visualMoving = false;
            this.visualFacing = 0;
            this.updateVisualMovement(
                MoveInputState.direction.x,
                MoveInputState.direction.y,
            );
        } catch (
            error
        ) {
            console.error(
                `[今晚守城] 主角视觉创建失败：${character.name}`,
                error,
            );
        }
    }

}
