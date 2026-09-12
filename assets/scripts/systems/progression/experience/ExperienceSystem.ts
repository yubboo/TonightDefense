/**
 * @architecture TonightDefense V1.0
 * @owner progression
 * @module experience
 *
 * 经验系统继续保留，但战斗场景不再显示：
 * - Lv.X
 * - 蓝色经验条
 * - 经验 X / X
 * - 升级文字提示
 *
 * 原因：
 * 当前战斗 HUD 只保留关卡/波次信息，
 * 避免占用竖屏战斗空间。
 */
import {
    _decorator,
    Component,
} from 'cc';

import {
    LevelState,
} from './LevelState';

import {
    AudioManager,
} from '../../audio/AudioManager';

const { ccclass } = _decorator;

@ccclass('ExperienceSystem')
export class ExperienceSystem
extends Component {
    static instance:
        ExperienceSystem | null =
        null;

    private readonly state =
        new LevelState();

    onLoad(): void {
        ExperienceSystem.instance =
            this;
    }

    start(): void {
        /**
         * 防止旧运行时残留节点。
         * 新版不会再创建 ExperienceUI。
         */
        const canvas =
            this.node.parent;

        const old =
            canvas?.getChildByName(
                'ExperienceUI',
            );

        if (old) {
            old.destroy();
        }

        const oldFlash =
            canvas?.getChildByName(
                'LevelUpFlash',
            );

        if (oldFlash) {
            oldFlash.destroy();
        }

        console.log(
            `[今晚守城] 经验系统启动（隐藏UI）：Lv.${this.state.level} ${this.state.exp}/${this.state.expToNextLevel}`,
        );
    }

    onDestroy(): void {
        if (
            ExperienceSystem.instance ===
            this
        ) {
            ExperienceSystem.instance =
                null;
        }
    }

    addExp(
        amount: number,
    ): void {
        const safeAmount =
            Math.max(
                0,
                Math.floor(amount),
            );

        if (
            safeAmount <= 0
        ) {
            return;
        }

        const oldLevel =
            this.state.level;

        const levelUps =
            this.state.addExp(
                safeAmount,
            );

        console.log(
            `[今晚守城] +${safeAmount} 经验，当前 Lv.${this.state.level} ${this.state.exp}/${this.state.expToNextLevel}`,
        );

        if (
            levelUps > 0
        ) {
            AudioManager.playSfx(
                'level_up',
                {
                    volume: 0.9,
                    minIntervalMs: 180,
                    throttleKey: 'level_up',
                },
            );

            console.log(
                `[今晚守城] 升级：Lv.${oldLevel} -> Lv.${this.state.level}`,
            );

            console.log(
                '[今晚守城] 经验升级只更新内部成长，不弹UI；三选一仍由小关通过触发',
            );
        }
    }

    get level(): number {
        return this.state.level;
    }

    get exp(): number {
        return this.state.exp;
    }

    get expToNextLevel(): number {
        return this.state
            .expToNextLevel;
    }
}
