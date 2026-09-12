/**
 * @architecture TonightDefense V1.0
 * @owner level
 * @module runtime
 *
 * 一个大关 = 40 个小关。
 *
 * 这个控制器拥有：
 * - 当前大关
 * - 当前小关
 * - 每波刷怪节奏
 * - 40波关底脚本
 * - 实时关卡进度
 * - 每波结束后的三选一入口
 *
 * 它不拥有：
 * - 怪物移动/攻击（BattleSystem）
 * - 三选一具体UI（ProgressionSystem）
 */
import {
    _decorator,
    BlockInputEvents,
    Color,
    Component,
    director,
    Graphics,
    Label,
    Layers,
    Node,
    UITransform,
} from 'cc';

import {
    EnemyController,
} from '../../battle/enemy/EnemyController';

import {
    EnemyArchetype,
    EnemyDeathEvent,
    EnemySpawnSpec,
} from '../../battle/enemy/EnemyTypes';

import {
    DefenseObjectiveService,
} from '../../battle/objective/DefenseObjectiveService';

import {
    StandardWaveDefinition,
    FinalWaveDefinition,
} from '../wave/ChapterWaveConfig';

import {
    getStageFinalWaveDefinition,
    getStageWaveDefinition,
} from '../stage/StageCatalog';

import {
    getWaveRewardKind,
} from '../../hero/progression/levelup/WaveRewardSchedule';

import {
    LevelUpChoiceController,
} from '../../hero/progression/levelup/LevelUpChoiceController';

import {
    ChapterWaveHUD,
} from '../../../ui/hud/ChapterWaveHUD';

import {
    HeroSelectionState,
} from '../../hero/character/selection/HeroSelectionState';

import {
    GameplaySessionState,
} from '../../gameplay/runtime/GameplaySessionState';

import {
    StageChestService,
} from '../stage/StageChestService';

import {
    ChapterProgressService,
} from '../stage/ChapterProgressService';

import {
    AudioManager,
} from '../../audio/AudioManager';

const {
    ccclass,
    property,
} = _decorator;

type FinalPhase =
    | 'none'
    | 'normal'
    | 'elite'
    | 'warning'
    | 'boss';

@ccclass('ChapterWaveController')
export class ChapterWaveController
extends Component {
    static instance:
        ChapterWaveController | null =
        null;

    @property
    chapterNumber = 1;

    @property
    startWaveNumber = 1;

    private currentWave = 1;

    private standardDefinition:
        StandardWaveDefinition | null =
        null;

    private finalDefinition:
        FinalWaveDefinition | null =
        null;

    private spawned = 0;
    private killed = 0;

    private spawnTimer = 0;

    private resolvingWave =
        false;

    private hud:
        ChapterWaveHUD | null =
        null;

    /**
     * Wave 40 专用状态。
     */
    private finalPhase:
        FinalPhase = 'none';

    private phaseSpawned = 0;
    private phaseKilled = 0;

    private bossCountdown = 0;
    private bossWarningVisible =
        0;

    private bossOverlay:
        Node | null = null;

    /**
     * 必须完成开局主角三选一后，
     * 才允许真正启动第1小关。
     */
    private battleStarted =
        false;

    private defeatShown =
        false;

    onLoad(): void {
        ChapterWaveController.instance =
            this;
    }

    start(): void {
        const canvas =
            this.node.parent;

        if (!canvas) {
            console.error(
                '[今晚守城] ChapterWaveController 找不到 Canvas',
            );
            return;
        }

        /** 大厅选中的章节是关卡与地图共同使用的唯一会话来源。 */
        this.chapterNumber =
            GameplaySessionState
                .get()
                .chapterNumber;

        this.currentWave =
            Math.max(
                1,
                Math.min(
                    40,
                    Math.floor(
                        this.startWaveNumber,
                    ),
                ),
            );

        EnemyController.instance
            ?.setDeathListener(
                (
                    event,
                ) =>
                    this.onEnemyKilled(
                        event,
                    ),
            );

        if (
            HeroSelectionState
                .hasSelected
        ) {
            this.beginAfterHeroSelection();
        } else {
            console.log(
                '[今晚守城] LevelSystem 等待开局主角选择完成',
            );
        }
    }

    /**
     * CharacterSystem 在主角三选一完成后调用。
     */
    beginAfterHeroSelection(): void {
        if (
            this.battleStarted ||
            !HeroSelectionState
                .hasSelected
        ) {
            return;
        }

        const canvas =
            this.node.parent;

        if (!canvas) {
            return;
        }

        this.battleStarted =
            true;

        this.hud =
            new ChapterWaveHUD(
                canvas,
            );

        this.scheduleOnce(
            () => {
                this.beginCurrentWave();
            },
            0.32,
        );

        console.log(
            '[今晚守城] 主角选择完成，第1小关开始',
        );
    }

    onDestroy(): void {
        EnemyController.instance
            ?.setDeathListener(
                null,
            );

        this.hud?.destroy();

        if (
            ChapterWaveController
                .instance ===
            this
        ) {
            ChapterWaveController.instance =
                null;
        }
    }

    update(
        dt: number,
    ): void {
        if (
            this.battleStarted &&
            DefenseObjectiveService.isGameOver
        ) {
            if (!this.defeatShown) {
                this.defeatShown = true;
                this.showBattleDefeat();
            }

            return;
        }

        if (
            !this.battleStarted ||
            this.resolvingWave ||
            this.defeatShown
        ) {
            return;
        }

        if (
            this.currentWave <
            40
        ) {
            this.updateStandardWave(
                dt,
            );
            return;
        }

        this.updateFinalWave(
            dt,
        );
    }

    get waveNumber(): number {
        return this.currentWave;
    }

    private beginCurrentWave(): void {
        this.resolvingWave =
            false;

        this.spawned = 0;
        this.killed = 0;
        this.spawnTimer = 0.18;

        if (
            this.currentWave <
            40
        ) {
            this.standardDefinition =
                getStageWaveDefinition(
                    this.chapterNumber,
                    this.currentWave,
                );

            this.finalDefinition =
                null;

            this.finalPhase =
                'none';

            this.refreshHud(
                '怪潮来袭',
            );

            console.log(
                `[今晚守城] 第${this.chapterNumber}关 小关${this.currentWave}/40 开始：${this.standardDefinition.totalEnemies}只，怪物Lv.${this.standardDefinition.enemyLevel}`,
            );

            return;
        }

        this.standardDefinition =
            null;

        this.finalDefinition =
            getStageFinalWaveDefinition(
                this.chapterNumber,
            );

        this.finalPhase =
            'normal';

        this.phaseSpawned = 0;
        this.phaseKilled = 0;

        this.refreshHud(
            '关底 · 普通怪',
        );

        console.log(
            `[今晚守城] 第${this.chapterNumber}关 小关40/40：关底战开始`,
        );
    }

    private updateStandardWave(
        dt: number,
    ): void {
        const definition =
            this.standardDefinition;

        const enemyController =
            EnemyController.instance;

        if (
            !definition ||
            !enemyController
        ) {
            return;
        }

        if (
            this.spawned >=
            definition.totalEnemies
        ) {
            return;
        }

        this.spawnTimer -= dt;

        if (
            this.spawnTimer > 0 ||
            !enemyController.canSpawn
        ) {
            return;
        }

        const rank =
            Math.random() <
            definition.eliteRatio
                ? 'elite'
                : 'normal';

        const archetype:
            EnemyArchetype =
            Math.random() <
            definition.rangedRatio
                ? 'ranged'
                : 'melee';

        const created =
            enemyController.spawnEnemy(
                {
                    archetype,
                    rank,

                    enemyLevel:
                        definition
                            .enemyLevel,

                    hpMultiplier:
                        definition
                            .hpMultiplier,

                    attackMultiplier:
                        definition
                            .attackMultiplier,

                    defenseBonus:
                        definition
                            .defenseBonus,

                    speedMultiplier:
                        definition
                            .speedMultiplier,
                },
            );

        if (created !== null) {
            this.spawned += 1;

            this.spawnTimer =
                definition
                    .spawnInterval;
        }
    }

    private updateFinalWave(
        dt: number,
    ): void {
        const definition =
            this.finalDefinition;

        const enemyController =
            EnemyController.instance;

        if (
            !definition ||
            !enemyController
        ) {
            return;
        }

        if (
            this.finalPhase ===
            'warning'
        ) {
            this.bossWarningVisible -=
                dt;

            this.bossCountdown -= dt;

            if (
                this.bossWarningVisible <=
                0
            ) {
                this.hideBossWarning();
            }

            if (
                this.bossCountdown <=
                0
            ) {
                this.beginBossPhase();
            }

            return;
        }

        if (
            this.finalPhase ===
            'boss'
        ) {
            return;
        }

        this.spawnTimer -= dt;

        if (
            this.spawnTimer > 0 ||
            !enemyController.canSpawn
        ) {
            return;
        }

        if (
            this.finalPhase ===
            'normal'
        ) {
            if (
                this.phaseSpawned >=
                definition.normalCount
            ) {
                return;
            }

            const archetype:
                EnemyArchetype =
                Math.random() <
                0.18
                    ? 'ranged'
                    : 'melee';

            const created =
                enemyController.spawnEnemy(
                    this.makeFinalSpec(
                        archetype,
                        'normal',
                        0.78,
                    ),
                );

            if (
                created !== null
            ) {
                this.phaseSpawned +=
                    1;

                this.spawned += 1;

                this.spawnTimer =
                    definition
                        .spawnInterval;
            }

            return;
        }

        if (
            this.finalPhase ===
            'elite'
        ) {
            if (
                this.phaseSpawned >=
                definition.eliteCount
            ) {
                return;
            }

            const archetype:
                EnemyArchetype =
                Math.random() <
                0.34
                    ? 'ranged'
                    : 'melee';

            const created =
                enemyController.spawnEnemy(
                    this.makeFinalSpec(
                        archetype,
                        'elite',
                        1,
                    ),
                );

            if (
                created !== null
            ) {
                this.phaseSpawned +=
                    1;

                this.spawned += 1;

                this.spawnTimer =
                    definition
                        .spawnInterval;
            }
        }
    }

    private makeFinalSpec(
        archetype:
            EnemyArchetype,
        rank:
            'normal'
            | 'elite',
        strength:
            number,
    ): EnemySpawnSpec {
        const definition =
            this.finalDefinition!;

        return {
            archetype,
            rank,

            enemyLevel:
                definition
                    .enemyLevel,

            hpMultiplier:
                definition
                    .hpMultiplier *
                strength,

            attackMultiplier:
                definition
                    .attackMultiplier *
                strength,

            defenseBonus:
                Math.max(
                    0,
                    Math.round(
                        definition
                            .defenseBonus *
                        strength,
                    ),
                ),

            speedMultiplier:
                definition
                    .speedMultiplier,
        };
    }

    private onEnemyKilled(
        event:
            EnemyDeathEvent,
    ): void {
        if (
            this.resolvingWave
        ) {
            return;
        }

        this.killed += 1;

        if (
            event.rank !==
            'boss'
        ) {
            AudioManager.playSfx(
                'enemy_death',
                {
                    volume: 0.62,
                    minIntervalMs: 95,
                    throttleKey: 'enemy_death',
                },
            );
        }

        if (
            this.currentWave <
            40
        ) {
            this.refreshHud(
                '怪潮来袭',
            );

            const definition =
                this.standardDefinition;

            if (
                definition &&
                this.killed >=
                    definition
                        .totalEnemies &&
                EnemyController
                    .instance
                    ?.aliveCount ===
                    0
            ) {
                this.completeWave();
            }

            return;
        }

        this.phaseKilled += 1;

        if (
            event.rank ===
            'boss'
        ) {
            AudioManager.playSfx(
                'flame_dragon_roar',
                {
                    volume: 0.86,
                    minIntervalMs: 1200,
                    throttleKey:
                        'flame_dragon_death',
                },
            );

            AudioManager.playBgm(
                'battle',
                0.6,
            );

            this.refreshHud(
                'BOSS 已击败',
            );

            this.completeWave();
            return;
        }

        if (
            this.finalPhase ===
            'normal'
        ) {
            this.refreshHud(
                '关底 · 普通怪',
            );

            const definition =
                this.finalDefinition;

            if (
                definition &&
                this.phaseKilled >=
                    definition
                        .normalCount &&
                EnemyController
                    .instance
                    ?.aliveCount ===
                    0
            ) {
                this.beginElitePhase();
            }

            return;
        }

        if (
            this.finalPhase ===
            'elite'
        ) {
            this.refreshHud(
                '关底 · 精英潮',
            );

            const definition =
                this.finalDefinition;

            if (
                definition &&
                this.phaseKilled >=
                    definition
                        .eliteCount &&
                EnemyController
                    .instance
                    ?.aliveCount ===
                    0
            ) {
                this.beginBossWarning();
            }
        }
    }

    private beginElitePhase(): void {
        this.finalPhase =
            'elite';

        this.phaseSpawned = 0;
        this.phaseKilled = 0;

        this.spawnTimer = 0.65;

        this.refreshHud(
            '关底 · 精英潮',
        );

        console.log(
            '[今晚守城] 关底普通怪已清理，精英怪潮进入战场',
        );
    }

    private beginBossWarning(): void {
        const definition =
            this.finalDefinition;

        if (!definition) {
            return;
        }

        this.finalPhase =
            'warning';

        /**
         * 精英清完后执行一次全屏清场：
         * 清掉遗留敌方投射物和异常残留怪物。
         */
        EnemyController.instance
            ?.clearAllEnemies(
                false,
            );

        EnemyController.instance
            ?.clearEnemyProjectiles();

        this.showBossWarning();

        AudioManager.playSfx(
            'boss_warning',
            {
                volume: 0.95,
                minIntervalMs: 600,
                throttleKey: 'boss_warning',
            },
        );

        this.bossWarningVisible =
            definition
                .bossWarningDuration;

        this.bossCountdown =
            definition
                .bossWarningDuration +
            definition
                .bossSpawnDelay;

        this.refreshHud(
            'BOSS 来袭',
        );

        console.log(
            '[今晚守城] 全屏清场 -> BOSS 来袭通告',
        );
    }

    private beginBossPhase(): void {
        if (
            this.finalPhase ===
            'boss'
        ) {
            return;
        }

        const definition =
            this.finalDefinition;

        const enemyController =
            EnemyController.instance;

        if (
            !definition ||
            !enemyController
        ) {
            return;
        }

        this.hideBossWarning();

        this.finalPhase =
            'boss';

        AudioManager.playBgm(
            'boss',
            0.55,
        );

        const created =
            enemyController.spawnEnemy(
                {
                    archetype:
                        'boss',

                    rank:
                        'boss',

                    bossId:
                        'flame_dragon',

                    enemyLevel:
                        definition
                            .enemyLevel,

                    hpMultiplier:
                        definition
                            .hpMultiplier,

                    attackMultiplier:
                        definition
                            .attackMultiplier,

                    defenseBonus:
                        definition
                            .defenseBonus,

                    speedMultiplier:
                        0.72,
                },
            );

        if (
            created !== null
        ) {
            this.spawned += 1;

            this.refreshHud(
                '关底首领',
            );

            console.log(
                '[今晚守城] BOSS 正式进入战场',
            );
        }
    }

    private completeWave(): void {
        if (
            this.resolvingWave
        ) {
            return;
        }

        this.resolvingWave =
            true;

        const completedWave =
            this.currentWave;

        /**
         * V3.0：
         * 大厅关卡卡必须显示真实的小关最高通过进度，
         * 所以每完成一小关就在 LevelSystem 内记录。
         *
         * 使用 max 语义，不会因为重新从第1小关开局而倒退。
         */
        ChapterProgressService
            .recordCompletedWave(
                this.chapterNumber,
                completedWave,
                40,
            );

        console.log(
            `[今晚守城] 小关 ${completedWave}/40 通过`,
        );

        AudioManager.playSfx(
            'wave_clear',
            {
                volume: 0.9,
                minIntervalMs: 350,
                throttleKey: 'wave_clear',
            },
        );

        const rewardKind =
            getWaveRewardKind(
                completedWave,
            );

        if (!rewardKind) {
            this.afterReward(
                completedWave,
            );
            return;
        }

        const choice =
            LevelUpChoiceController
                .instance;

        if (!choice) {
            this.afterReward(
                completedWave,
            );
            return;
        }

        choice.showWaveReward(
            completedWave,
            rewardKind,
            () => {
                this.afterReward(
                    completedWave,
                );
            },
        );
    }

    private afterReward(
        completedWave:
            number,
    ): void {
        if (
            completedWave >=
            40
        ) {
            this.showChapterClear();
            return;
        }

        this.currentWave =
            completedWave + 1;

        this.scheduleOnce(
            () => {
                this.beginCurrentWave();
            },
            0.38,
        );
    }

    private refreshHud(
        phaseText:
            string,
    ): void {
        if (!this.hud) {
            return;
        }

        if (
            this.currentWave <
            40
        ) {
            const definition =
                this.standardDefinition;

            if (!definition) {
                return;
            }

            this.hud.update(
                this.chapterNumber,
                this.currentWave,
                definition
                    .enemyLevel,
                this.killed,
                definition
                    .totalEnemies,
                phaseText,
            );

            return;
        }

        const definition =
            this.finalDefinition;

        if (!definition) {
            return;
        }

        const total =
            definition.normalCount +
            definition.eliteCount +
            1;

        this.hud.update(
            this.chapterNumber,
            40,
            definition.enemyLevel,
            this.killed,
            total,
            phaseText,
        );
    }

    private showBossWarning(): void {
        const canvas =
            this.node.parent;

        if (!canvas) {
            return;
        }

        this.hideBossWarning();

        const overlay =
            new Node(
                'BossWarningOverlay',
            );

        overlay.layer =
            Layers.Enum.UI_2D;

        canvas.addChild(overlay);

        overlay.addComponent(
            UITransform,
        ).setContentSize(
            720,
            1280,
        );

        overlay.addComponent(
            BlockInputEvents,
        );

        const g =
            overlay.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                35,
                19,
                29,
                185,
            );

        g.rect(
            -360,
            -640,
            720,
            1280,
        );

        g.fill();

        g.fillColor =
            new Color(
                104,
                28,
                44,
                235,
            );

        g.rect(
            -360,
            -95,
            720,
            190,
        );

        g.fill();

        const titleNode =
            new Node(
                'BossWarningTitle',
            );

        titleNode.layer =
            Layers.Enum.UI_2D;

        overlay.addChild(
            titleNode,
        );

        titleNode.addComponent(
            UITransform,
        ).setContentSize(
            620,
            100,
        );

        const title =
            titleNode.addComponent(
                Label,
            );

        title.string =
            '赤金炎龙 来袭';

        title.fontSize = 66;
        title.lineHeight = 78;

        title.color =
            new Color(
                255,
                225,
                214,
                255,
            );

        const subNode =
            new Node(
                'BossWarningSub',
            );

        subNode.layer =
            Layers.Enum.UI_2D;

        overlay.addChild(
            subNode,
        );

        subNode.setPosition(
            0,
            -72,
            0,
        );

        subNode.addComponent(
            UITransform,
        ).setContentSize(
            560,
            40,
        );

        const sub =
            subNode.addComponent(
                Label,
            );

        sub.string =
            '焰岩之王即将焚毁防线';

        sub.fontSize = 24;
        sub.lineHeight = 30;

        sub.color =
            new Color(
                244,
                207,
                197,
                255,
            );

        this.bossOverlay =
            overlay;
    }

    private hideBossWarning(): void {
        if (
            this.bossOverlay &&
            this.bossOverlay.isValid
        ) {
            this.bossOverlay.destroy();
        }

        this.bossOverlay =
            null;
    }

    private showChapterClear(): void {
        /**
         * 40波完整通关至少解锁1星阶段宝箱。
         * 2星/3星的评价条件尚未定义，不在这里乱猜。
         */
        StageChestService.unlockStars(
            this.chapterNumber,
            1,
        );

        const canvas =
            this.node.parent;

        if (!canvas) {
            return;
        }

        const overlay =
            new Node(
                'ChapterClearOverlay',
            );

        overlay.layer =
            Layers.Enum.UI_2D;

        canvas.addChild(
            overlay,
        );

        overlay.addComponent(
            UITransform,
        ).setContentSize(
            720,
            1280,
        );

        overlay.addComponent(
            BlockInputEvents,
        );

        const g =
            overlay.addComponent(
                Graphics,
            );

        g.fillColor =
            new Color(
                28,
                37,
                38,
                155,
            );

        g.rect(
            -360,
            -640,
            720,
            1280,
        );

        g.fill();

        const node =
            new Node(
                'ChapterClearText',
            );

        node.layer =
            Layers.Enum.UI_2D;

        overlay.addChild(node);

        node.addComponent(
            UITransform,
        ).setContentSize(
            620,
            120,
        );

        const label =
            node.addComponent(
                Label,
            );

        label.string =
            `第${this.chapterNumber}关 通关`;

        label.fontSize = 58;
        label.lineHeight = 70;

        label.color =
            new Color(
                246,
                229,
                176,
                255,
            );

        const back =
            new Node(
                'ReturnMainMenuButton',
            );

        back.layer =
            Layers.Enum.UI_2D;

        overlay.addChild(
            back,
        );

        back.setPosition(
            0,
            -105,
            0,
        );

        back.addComponent(
            UITransform,
        ).setContentSize(
            260,
            72,
        );

        const bg =
            back.addComponent(
                Graphics,
            );

        bg.fillColor =
            new Color(
                246,
                193,
                64,
                255,
            );

        bg.roundRect(
            -130,
            -36,
            260,
            72,
            16,
        );
        bg.fill();

        bg.strokeColor =
            new Color(
                45,
                49,
                45,
                255,
            );

        bg.lineWidth = 4;
        bg.roundRect(
            -128,
            -34,
            256,
            68,
            14,
        );
        bg.stroke();

        const backText =
            new Node(
                'Text',
            );

        backText.layer =
            Layers.Enum.UI_2D;

        back.addChild(
            backText,
        );

        backText.addComponent(
            UITransform,
        ).setContentSize(
            220,
            52,
        );

        const backLabel =
            backText.addComponent(
                Label,
            );

        backLabel.string =
            '返回大厅';

        backLabel.fontSize = 28;
        backLabel.lineHeight = 34;

        backLabel.color =
            new Color(
                44,
                48,
                44,
                255,
            );

        back.on(
            Node.EventType.TOUCH_END,
            () => {
                director.loadScene(
                    'MainMenu',
                );
            },
        );

        console.log(
            `[今晚守城] 第${this.chapterNumber}关 40波全部完成`,
        );
    }

    private showBattleDefeat(): void {
        const canvas = this.node.parent;

        if (!canvas) {
            return;
        }

        const old =
            canvas.getChildByName('BattleDefeatOverlay');

        old?.destroy();

        const overlay =
            new Node('BattleDefeatOverlay');
        overlay.layer = Layers.Enum.UI_2D;
        canvas.addChild(overlay);
        overlay.addComponent(UITransform)
            .setContentSize(720, 1280);
        overlay.addComponent(BlockInputEvents);

        const shade = overlay.addComponent(Graphics);
        shade.fillColor = new Color(18, 25, 39, 215);
        shade.rect(-360, -640, 720, 1280);
        shade.fill();

        const titleNode = new Node('DefeatTitle');
        titleNode.layer = Layers.Enum.UI_2D;
        overlay.addChild(titleNode);
        titleNode.setPosition(0, 90, 0);
        titleNode.addComponent(UITransform)
            .setContentSize(560, 90);

        const title = titleNode.addComponent(Label);
        title.string = '王城防线失守';
        title.fontSize = 54;
        title.lineHeight = 66;
        title.color = new Color(255, 219, 190, 255);

        const detailNode = new Node('DefeatDetail');
        detailNode.layer = Layers.Enum.UI_2D;
        overlay.addChild(detailNode);
        detailNode.setPosition(0, 15, 0);
        detailNode.addComponent(UITransform)
            .setContentSize(520, 52);

        const detail = detailNode.addComponent(Label);
        detail.string = `坚持至第 ${this.currentWave}/40 波`;
        detail.fontSize = 25;
        detail.lineHeight = 32;
        detail.color = new Color(225, 229, 239, 255);

        this.createResultButton(
            overlay,
            -135,
            -95,
            '重新挑战',
            () => director.loadScene('Battle'),
        );

        this.createResultButton(
            overlay,
            135,
            -95,
            '返回大厅',
            () => director.loadScene('MainMenu'),
        );

    }

    private createResultButton(
        parent: Node,
        x: number,
        y: number,
        text: string,
        onClick: () => void,
    ): void {
        const button = new Node(`ResultButton_${text}`);
        button.layer = Layers.Enum.UI_2D;
        parent.addChild(button);
        button.setPosition(x, y, 0);
        button.addComponent(UITransform)
            .setContentSize(230, 72);

        const graphics = button.addComponent(Graphics);
        graphics.fillColor = new Color(38, 82, 142, 255);
        graphics.roundRect(-115, -36, 230, 72, 16);
        graphics.fill();
        graphics.strokeColor = new Color(238, 191, 82, 255);
        graphics.lineWidth = 4;
        graphics.roundRect(-113, -34, 226, 68, 14);
        graphics.stroke();

        const labelNode = new Node('Text');
        labelNode.layer = Layers.Enum.UI_2D;
        button.addChild(labelNode);
        labelNode.addComponent(UITransform)
            .setContentSize(200, 52);

        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = 27;
        label.lineHeight = 34;
        label.color = new Color(255, 247, 222, 255);

        button.on(Node.EventType.TOUCH_END, onClick);
    }
}
