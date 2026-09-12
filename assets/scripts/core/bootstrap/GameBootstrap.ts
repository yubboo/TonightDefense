/**
 * @architecture TonightDefense V1.0
 * @owner core
 * @module bootstrap
 *
 * 启动顺序：
 * 1. 开局主角三选一
 * 2. 主角创建
 * 3. 第1小关开始
 */
import {
    _decorator,
    Component,
} from 'cc';

import {
    GameMode,
} from '../../shared/GameEnums';

import {
    PreBattleHeroSelectionController,
} from '../../systems/character/selection/PreBattleHeroSelectionController';

import {
    ChapterWaveController,
} from '../../systems/level/runtime/ChapterWaveController';

import {
    HeroSelectionState,
} from '../../systems/character/selection/HeroSelectionState';

import {
    BattleTargetRegistry,
} from '../../systems/battle/targeting/BattleTargetRegistry';

import {
    GamePerformanceSettings,
} from '../../systems/settings/GamePerformanceSettings';

import {
    AudioManager,
} from '../../systems/audio/AudioManager';

import {
    BattleCameraController,
} from '../../systems/battle/view/BattleCameraController';

import {
    BattleWorldService,
} from '../../systems/battle/view/BattleWorldService';

const {
    ccclass,
    property,
} = _decorator;

@ccclass('GameBootstrap')
export class GameBootstrap
extends Component {
    @property({
        tooltip:
            '本地测试真人玩家数量：1~4',
        min: 1,
        max: 4,
        step: 1,
    })
    testHumanPlayerCount = 1;

    start(): void {
        GamePerformanceSettings
            .ensureApplied();

        const canvas =
            this.node.parent;

        if (canvas) {
            BattleWorldService.ensure(
                canvas,
            );
        }

        if (
            !this.node.getComponent(
                BattleCameraController,
            )
        ) {
            this.node.addComponent(
                BattleCameraController,
            );
        }

        AudioManager.playBgm(
            'battle',
            0.4,
        );

        /**
         * 每次进入 Battle.scene 都视为新的一局。
         * 先清掉静态战斗目标表，避免微信开发者工具热重载/场景重进
         * 残留旧版本目标对象，导致 isAlive 接口不一致并在每帧更新中报错。
         */
        BattleTargetRegistry.clear();

        /**
         * 清掉上一次预览/上一局残留的主角选择。
         */
        HeroSelectionState.beginNewRun();

        const humanCount =
            Math.max(
                1,
                Math.min(
                    4,
                    Math.floor(
                        this
                            .testHumanPlayerCount,
                    ),
                ),
            );

        const mode =
            humanCount === 1
                ? GameMode.Solo
                : GameMode.Multiplayer;

        console.log(
            '====================================',
        );

        console.log(
            '[今晚守城] 项目启动',
        );

        console.log(
            `[模式] ${mode}`,
        );

        console.log(
            '[开局流程] 先选择主角，再开始第1小关',
        );

        console.log(
            '====================================',
        );

        /**
         * 先挂主角选择，再挂关卡。
         *
         * ChapterWaveController 自己也有 HeroSelectionState 门禁，
         * 所以不会因为组件 start 顺序导致第1波偷跑。
         */
        if (
            !this.node.getComponent(
                PreBattleHeroSelectionController,
            )
        ) {
            this.node.addComponent(
                PreBattleHeroSelectionController,
            );
        }

        if (
            !this.node.getComponent(
                ChapterWaveController,
            )
        ) {
            this.node.addComponent(
                ChapterWaveController,
            );
        }
    }
}
