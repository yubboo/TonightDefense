/**
 * @architecture TonightDefense V1.0
 * @owner gameplay
 * @module pause
 *
 * 战斗暂停的唯一状态拥有者。
 *
 * 设计原则：
 * - 只使用 director.pause()/resume() 暂停战斗逻辑；
 * - Director 暂停时仍继续渲染和响应 UI 输入，适合暂停菜单；
 * - 场景切换前必须恢复 Director，避免把暂停状态带进下一场景；
 * - 不负责创建 UI，UI 只向本服务发出暂停/继续意图。
 */
import {
    director,
} from 'cc';

export class BattlePauseService {
    private static paused = false;

    private static pausedDirectorByUs = false;

    static isPaused(): boolean {
        return this.paused;
    }

    static pause(): void {
        if (this.paused) {
            return;
        }

        this.paused = true;
        this.pausedDirectorByUs =
            !director.isPaused();

        if (
            this.pausedDirectorByUs
        ) {
            director.pause();
        }
    }

    static resume(): void {
        if (!this.paused) {
            return;
        }

        this.paused = false;

        if (
            this.pausedDirectorByUs &&
            director.isPaused()
        ) {
            director.resume();
        }

        this.pausedDirectorByUs = false;
    }

    /**
     * 重开 / 返回大厅前使用。
     * 场景加载必须在 Director 正常运行时进行，
     * 因此这里强制清掉本系统留下的暂停状态。
     */
    static resumeForSceneChange(): void {
        this.paused = false;
        this.pausedDirectorByUs = false;

        if (director.isPaused()) {
            director.resume();
        }
    }
}
