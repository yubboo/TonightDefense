/**
 * @architecture TonightDefense V1.0
 * @owner audio
 * @module runtime
 *
 * 全局音频系统：
 * - 跨场景常驻
 * - BGM 自动循环 + 淡入淡出
 * - SFX / UI 音效并发播放
 * - 主音量 / BGM / SFX / 静音即时生效
 * - 高频音效节流，避免群怪战斗时声音和性能一起爆掉
 * - Web 解锁逻辑基于 v0.3.8 Last Known Good：首次交互只恢复一次，不参与普通点击播放
 */
import {
    _decorator,
    AudioClip,
    AudioSource,
    Component,
    director,
    input,
    Input,
    Node,
    resources,
} from 'cc';

import {
    GameAudioSettings,
} from './GameAudioSettings';

const {
    ccclass,
} = _decorator;

export type GameBgmId =
    | 'menu'
    | 'battle'
    | 'boss';

export type GameSfxId =
    | 'ui_click'
    | 'hero_attack'
    | 'hit'
    | 'enemy_death'
    | 'wave_clear'
    | 'level_up'
    | 'boss_warning'
    | 'flame_dragon_roar';

export interface PlaySfxOptions {
    volume?: number;
    minIntervalMs?: number;
    throttleKey?: string;
}

const BGM_PATHS:
    Record<GameBgmId, string> = {
        menu:
            'audio/bgm/menu_theme',
        battle:
            'audio/bgm/battle_theme',
        boss:
            'audio/bgm/boss_theme',
    };

const SFX_PATHS:
    Record<GameSfxId, string> = {
        ui_click:
            'audio/sfx/ui_click',
        hero_attack:
            'audio/sfx/hero_attack',
        hit:
            'audio/sfx/hit',
        enemy_death:
            'audio/sfx/enemy_death',
        wave_clear:
            'audio/sfx/wave_clear',
        level_up:
            'audio/sfx/level_up',
        boss_warning:
            'audio/sfx/boss_warning',
        flame_dragon_roar:
            'audio/sfx/flame_dragon_roar',
    };

@ccclass('AudioManager')
export class AudioManager
extends Component {
    private static instance:
        AudioManager | null = null;

    private bgmSource!: AudioSource;
    private sfxSource!: AudioSource;
    private uiSource!: AudioSource;

    private readonly clipCache =
        new Map<string, AudioClip>();

    private readonly loadingCache =
        new Map<
            string,
            Promise<AudioClip | null>
        >();

    private readonly lastSfxAt =
        new Map<string, number>();

    private activeBgm:
        GameBgmId | null = null;

    private bgmRequestSerial = 0;

    private pendingBgm:
        {
            id: GameBgmId;
            clip: AudioClip;
            fadeSeconds: number;
        } | null = null;

    private bgmGain = 0;

    private bgmBaseVolume = 0.5;
    private sfxBaseVolume = 0.8;
    private fadeDirection:
        -1 | 0 | 1 = 0;
    private fadeSeconds = 0.35;

    /**
     * 浏览器（尤其 Cocos Web 预览）会因为自动播放策略，
     * 在用户第一次触摸/点击前暂停音频上下文。
     *
     * 我们让音频保持“默认开启”，并在第一次任意交互时自动解锁，
     * 不再要求玩家专门打开设置面板。
     */
    private audioUnlockedByGesture = false;

    onLoad(): void {
        if (
            AudioManager.instance &&
            AudioManager.instance !==
                this
        ) {
            this.node.destroy();
            return;
        }

        AudioManager.instance =
            this;

        director.addPersistRootNode(
            this.node,
        );

        const bgmNode =
            new Node('BGM');
        const sfxNode =
            new Node('SFX');
        const uiNode =
            new Node('UIAudio');

        this.node.addChild(bgmNode);
        this.node.addChild(sfxNode);
        this.node.addChild(uiNode);

        this.bgmSource =
            bgmNode.addComponent(
                AudioSource,
            );

        this.sfxSource =
            sfxNode.addComponent(
                AudioSource,
            );

        this.uiSource =
            uiNode.addComponent(
                AudioSource,
            );

        this.bgmSource.loop = true;

        GameAudioSettings
            .ensureLoaded();

        this.applySettings();
        this.registerAudioUnlockEvents();

        // 不在启动阶段预载 SFX。
        // 浏览器预览时只在真正需要播放时再加载，
        // 避免刷新页面就额外触发音频资源请求。
    }

    update(
        dt: number,
    ): void {
        if (
            this.fadeDirection !== 0
        ) {
            const safeDt =
                Math.min(
                    Math.max(dt, 0),
                    1 / 20,
                );

            const duration =
                Math.max(
                    0.05,
                    this.fadeSeconds,
                );

            this.bgmGain +=
                this.fadeDirection *
                safeDt /
                duration;

            if (
                this.fadeDirection < 0 &&
                this.bgmGain <= 0
            ) {
                this.bgmGain = 0;
                this.fadeDirection = 0;
                this.activatePendingBgm();
            } else if (
                this.fadeDirection > 0 &&
                this.bgmGain >= 1
            ) {
                this.bgmGain = 1;
                this.fadeDirection = 0;
            }
        }

        this.applyBgmVolume();
    }

    onDestroy(): void {
        this.unregisterAudioUnlockEvents();

        if (
            AudioManager.instance ===
            this
        ) {
            AudioManager.instance =
                null;
        }
    }

    private registerAudioUnlockEvents(): void {
        input.on(
            Input.EventType.TOUCH_END,
            this.onFirstUserGesture,
            this,
        );

        input.on(
            Input.EventType.MOUSE_UP,
            this.onFirstUserGesture,
            this,
        );

        input.on(
            Input.EventType.KEY_DOWN,
            this.onFirstUserGesture,
            this,
        );
    }

    private unregisterAudioUnlockEvents(): void {
        input.off(
            Input.EventType.TOUCH_END,
            this.onFirstUserGesture,
            this,
        );

        input.off(
            Input.EventType.MOUSE_UP,
            this.onFirstUserGesture,
            this,
        );

        input.off(
            Input.EventType.KEY_DOWN,
            this.onFirstUserGesture,
            this,
        );
    }

    /**
     * 第一次任意操作都会执行这里。
     *
     * 在浏览器里必须把 play() 放在用户手势回调中，
     * 才能稳定通过自动播放限制；微信小游戏/原生环境如果本来就能播放，
     * 这里检测到已在播放后不会重启 BGM。
     */
    private onFirstUserGesture(): void {
        if (this.audioUnlockedByGesture) {
            return;
        }

        this.audioUnlockedByGesture = true;
        this.unregisterAudioUnlockEvents();

        this.applySettings();

        if (
            this.activeBgm !== null &&
            this.bgmSource.clip &&
            !this.bgmSource.playing
        ) {
            this.bgmSource.play();
        }

        console.log(
            '[今晚守城] 音频已通过首次交互自动解锁',
        );
    }

    static ensure(): AudioManager {
        if (
            this.instance &&
            this.instance.node.isValid
        ) {
            return this.instance;
        }

        const scene =
            director.getScene();

        const node =
            new Node(
                '__AudioManager__',
            );

        scene?.addChild(node);

        return node.addComponent(
            AudioManager,
        );
    }

    static playBgm(
        id: GameBgmId,
        fadeSeconds = 0.35,
    ): void {
        void this.ensure()
            .requestBgm(
                id,
                fadeSeconds,
            );
    }

    static playSfx(
        id: GameSfxId,
        options:
            PlaySfxOptions = {},
    ): void {
        void this.ensure()
            .requestSfx(
                id,
                false,
                options,
            );
    }

    static playUi(
        id:
            GameSfxId =
                'ui_click',
        options:
            PlaySfxOptions = {},
    ): void {
        void this.ensure()
            .requestSfx(
                id,
                true,
                options,
            );
    }

    static refreshVolumes(): void {
        this.ensure()
            .applySettings();
    }

    private async requestBgm(
        id: GameBgmId,
        fadeSeconds: number,
    ): Promise<void> {
        if (
            this.activeBgm === id &&
            !this.pendingBgm
        ) {
            return;
        }

        const requestSerial =
            ++this.bgmRequestSerial;

        const clip =
            await this.loadClip(
                BGM_PATHS[id],
            );

        if (
            !clip ||
            requestSerial !==
                this.bgmRequestSerial
        ) {
            return;
        }

        if (
            this.activeBgm === id &&
            !this.pendingBgm
        ) {
            return;
        }

        this.pendingBgm = {
            id,
            clip,
            fadeSeconds:
                Math.max(
                    0.05,
                    fadeSeconds,
                ),
        };

        if (
            this.activeBgm === null ||
            this.bgmGain <= 0.001
        ) {
            this.activatePendingBgm();
            return;
        }

        this.fadeSeconds =
            this.pendingBgm
                .fadeSeconds;
        this.fadeDirection = -1;
    }

    private activatePendingBgm(): void {
        const pending =
            this.pendingBgm;

        if (!pending) {
            return;
        }

        this.pendingBgm = null;

        this.bgmSource.stop();
        this.bgmSource.clip =
            pending.clip;
        this.bgmSource.loop = true;

        this.activeBgm =
            pending.id;
        this.bgmGain = 0;
        this.fadeSeconds =
            pending.fadeSeconds;
        this.fadeDirection = 1;

        this.applyBgmVolume();
        this.bgmSource.play();
    }

    private async requestSfx(
        id: GameSfxId,
        ui: boolean,
        options:
            PlaySfxOptions,
    ): Promise<void> {
        const minInterval =
            Math.max(
                0,
                options.minIntervalMs ??
                    0,
            );

        const throttleKey =
            options.throttleKey ??
            id;

        if (
            minInterval > 0
        ) {
            const now = Date.now();
            const last =
                this.lastSfxAt.get(
                    throttleKey,
                ) ?? 0;

            if (
                now - last <
                minInterval
            ) {
                return;
            }

            this.lastSfxAt.set(
                throttleKey,
                now,
            );
        }

        const clip =
            await this.loadClip(
                SFX_PATHS[id],
            );

        if (!clip) {
            return;
        }

        const source =
            ui
                ? this.uiSource
                : this.sfxSource;

        const volume =
            Math.max(
                0,
                Math.min(
                    1,
                    options.volume ??
                        1,
                ),
            );

        source.playOneShot(
            clip,
            volume,
        );
    }

    private applySettings(): void {
        const settings =
            GameAudioSettings
                .getSnapshot();

        const muteFactor =
            settings.muted
                ? 0
                : 1;

        this.bgmBaseVolume =
            settings.masterVolume *
            settings.bgmVolume *
            muteFactor;

        this.sfxBaseVolume =
            settings.masterVolume *
            settings.sfxVolume *
            muteFactor;

        this.sfxSource.volume =
            this.sfxBaseVolume;

        this.uiSource.volume =
            this.sfxBaseVolume;

        this.applyBgmVolume();
    }

    private applyBgmVolume(): void {
        if (!this.bgmSource) {
            return;
        }

        this.bgmSource.volume =
            this.bgmBaseVolume *
            this.bgmGain;
    }

    private loadClip(
        path: string,
    ): Promise<AudioClip | null> {
        const cached =
            this.clipCache.get(path);

        if (cached) {
            return Promise.resolve(
                cached,
            );
        }

        const loading =
            this.loadingCache.get(
                path,
            );

        if (loading) {
            return loading;
        }

        const promise =
            new Promise<AudioClip | null>(
                (
                    resolve,
                ) => {
                    resources.load(
                        path,
                        AudioClip,
                        (
                            error,
                            clip,
                        ) => {
                            this.loadingCache
                                .delete(
                                    path,
                                );

                            if (
                                error ||
                                !clip
                            ) {
                                console.warn(
                                    `[今晚守城] 音频资源加载失败：${path}`,
                                    error,
                                );

                                resolve(null);
                                return;
                            }

                            this.clipCache.set(
                                path,
                                clip,
                            );

                            resolve(clip);
                        },
                    );
                },
            );

        this.loadingCache.set(
            path,
            promise,
        );

        return promise;
    }
}
