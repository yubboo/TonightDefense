/**
 * @architecture TonightDefense V1.0
 * @owner settings
 * @module performance
 *
 * 游戏性能设置：
 * - 统一保存/应用目标帧率。
 * - Web / 原生环境可请求 30 / 60 / 120。
 * - 微信小游戏当前公开帧率接口上限为 60，因此 120 在微信端显示但禁用。
 */
import {
    game,
    sys,
} from 'cc';

export type GameFrameRate =
    | 30
    | 60
    | 120;

export interface FrameRateOptionState {
    value: GameFrameRate;
    supported: boolean;
}

interface WeChatFrameRateApi {
    setPreferredFramesPerSecond?: (
        fps: number,
    ) => void;
}

interface PerformanceSaveData {
    version: 1;
    frameRate: GameFrameRate;
}

export class GamePerformanceSettings {
    private static readonly STORAGE_KEY =
        'tonight-defense.performance-settings.v1';

    private static loaded = false;

    private static preferredFrameRate:
        GameFrameRate = 60;

    private static appliedFrameRate:
        GameFrameRate = 60;

    /**
     * 避免大厅、战斗、设置面板重复进入时反复调用微信 JSBridge。
     * 帧率没有变化就不重复下发。
     */
    private static lastWeChatFrameRate:
        GameFrameRate | null = null;

    /**
     * 大厅和战斗场景都会调用。重复调用是安全的。
     */
    static ensureApplied(): void {
        this.ensureLoaded();
        this.applyFrameRate(
            this.preferredFrameRate,
            false,
        );
    }

    static getPreferredFrameRate():
        GameFrameRate {
        this.ensureLoaded();
        return this.preferredFrameRate;
    }

    static getAppliedFrameRate():
        GameFrameRate {
        this.ensureLoaded();
        return this.appliedFrameRate;
    }

    static getFrameRateOptions():
        FrameRateOptionState[] {
        const max =
            this.getPlatformMaxFrameRate();

        return [
            30,
            60,
            120,
        ].map(
            (value) => ({
                value:
                    value as
                        GameFrameRate,
                supported:
                    value <= max,
            }),
        );
    }

    static setFrameRate(
        requested:
            GameFrameRate,
    ): GameFrameRate {
        this.ensureLoaded();

        this.preferredFrameRate =
            requested;

        this.save();

        return this.applyFrameRate(
            requested,
            true,
        );
    }

    static isWeChatMiniGame(): boolean {
        /**
         * 只判断 wx 运行时是否存在，不依赖帧率 API 是否已经 ready。
         * 这样微信启动早期即使 JSBridge 尚未完全就绪，也不会误把平台
         * 判断成 Web，进而错误开放 120 FPS。
         */
        return !!this.getWeChatRuntime();
    }

    static getPlatformMaxFrameRate():
        GameFrameRate {
        /**
         * 微信小游戏公开的 setPreferredFramesPerSecond
         * 当前有效范围到 60。不要在微信端伪装成 120，
         * 否则 UI 选了 120 但实际仍然 60，会让玩家误判。
         */
        if (
            this.isWeChatMiniGame()
        ) {
            return 60;
        }

        return 120;
    }

    private static ensureLoaded(): void {
        if (this.loaded) {
            return;
        }

        this.loaded = true;

        const raw =
            sys.localStorage
                .getItem(
                    this.STORAGE_KEY,
                );

        if (raw) {
            try {
                const parsed =
                    JSON.parse(raw) as
                        Partial<PerformanceSaveData>;

                const value =
                    Number(
                        parsed.frameRate,
                    );

                if (
                    value === 30 ||
                    value === 60 ||
                    value === 120
                ) {
                    this.preferredFrameRate =
                        value;
                }
            } catch (error) {
                console.warn(
                    '[今晚守城] 性能设置读取失败，使用默认 60 FPS',
                    error,
                );
            }
        }
    }

    private static save(): void {
        const data:
            PerformanceSaveData = {
                version: 1,
                frameRate:
                    this.preferredFrameRate,
            };

        sys.localStorage.setItem(
            this.STORAGE_KEY,
            JSON.stringify(data),
        );
    }

    private static applyFrameRate(
        requested:
            GameFrameRate,
        printLog:
            boolean,
    ): GameFrameRate {
        const max =
            this.getPlatformMaxFrameRate();

        const effective =
            Math.min(
                requested,
                max,
            ) as GameFrameRate;

        /**
         * Cocos 自身的目标帧率。
         * 实际帧率仍取决于屏幕刷新率、设备负载和平台调度。
         */
        if (
            game.frameRate !==
            effective
        ) {
            game.frameRate =
                effective;
        }

        const wxApi =
            this.getWeChatRuntime();

        if (
            wxApi
                ?.setPreferredFramesPerSecond &&
            this.lastWeChatFrameRate !==
                effective
        ) {
            try {
                wxApi
                    .setPreferredFramesPerSecond(
                        effective,
                    );

                this.lastWeChatFrameRate =
                    effective;
            } catch (error) {
                /**
                 * 开发者工具启动极早期可能出现 JSBridge not ready。
                 * 不把失败值写入 lastWeChatFrameRate，下一次场景/设置面板
                 * ensureApplied() 时会自动再尝试一次。
                 */
                console.warn(
                    '[今晚守城] 微信帧率设置暂未就绪，稍后会自动重试',
                    error,
                );
            }
        }

        this.appliedFrameRate =
            effective;

        if (printLog) {
            if (
                requested !==
                effective
            ) {
                console.log(
                    `[今晚守城] 帧率请求 ${requested} FPS，当前平台应用 ${effective} FPS`,
                );
            } else {
                console.log(
                    `[今晚守城] 帧率已切换为 ${effective} FPS`,
                );
            }
        }

        return effective;
    }

    private static getWeChatRuntime():
        WeChatFrameRateApi | null {
        const scope =
            globalThis as unknown as {
                wx?:
                    WeChatFrameRateApi;
            };

        const wxApi =
            scope.wx;

        if (!wxApi) {
            return null;
        }

        return wxApi;
    }
}
