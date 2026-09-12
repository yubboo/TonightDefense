/**
 * @architecture TonightDefense V1.0
 * @owner audio
 * @module settings
 *
 * 音频设置统一入口：
 * - 主音量
 * - 背景音乐
 * - 游戏音效（含 UI）
 * - 静音
 */
import {
    sys,
} from 'cc';

export interface GameAudioSettingsSnapshot {
    masterVolume: number;
    bgmVolume: number;
    sfxVolume: number;
    muted: boolean;
}

interface GameAudioSaveData
extends GameAudioSettingsSnapshot {
    version: 1;
}

export class GameAudioSettings {
    private static readonly STORAGE_KEY =
        'tonight-defense.audio-settings.v1';

    private static loaded = false;

    private static state:
        GameAudioSettingsSnapshot = {
            masterVolume: 1,
            bgmVolume: 0.7,
            sfxVolume: 0.7,
            muted: false,
        };

    static ensureLoaded(): void {
        if (this.loaded) {
            return;
        }

        this.loaded = true;

        const raw =
            sys.localStorage.getItem(
                this.STORAGE_KEY,
            );

        if (!raw) {
            return;
        }

        try {
            const parsed =
                JSON.parse(raw) as
                    Partial<GameAudioSaveData>;

            this.state = {
                masterVolume:
                    this.clampVolume(
                        parsed.masterVolume ??
                            this.state.masterVolume,
                    ),

                bgmVolume:
                    this.clampVolume(
                        parsed.bgmVolume ??
                            this.state.bgmVolume,
                    ),

                sfxVolume:
                    this.clampVolume(
                        parsed.sfxVolume ??
                            this.state.sfxVolume,
                    ),

                muted:
                    parsed.muted === true,
            };
        } catch (error) {
            console.warn(
                '[今晚守城] 音频设置读取失败，使用默认值',
                error,
            );
        }
    }

    static getSnapshot():
        GameAudioSettingsSnapshot {
        this.ensureLoaded();

        return {
            ...this.state,
        };
    }

    static getMasterVolume(): number {
        this.ensureLoaded();
        return this.state.masterVolume;
    }

    static getBgmVolume(): number {
        this.ensureLoaded();
        return this.state.bgmVolume;
    }

    static getSfxVolume(): number {
        this.ensureLoaded();
        return this.state.sfxVolume;
    }

    static isMuted(): boolean {
        this.ensureLoaded();
        return this.state.muted;
    }

    static setMasterVolume(
        value: number,
    ): void {
        this.ensureLoaded();
        this.state.masterVolume =
            this.clampVolume(value);
        this.save();
    }

    static setBgmVolume(
        value: number,
    ): void {
        this.ensureLoaded();
        this.state.bgmVolume =
            this.clampVolume(value);
        this.save();
    }

    static setSfxVolume(
        value: number,
    ): void {
        this.ensureLoaded();
        this.state.sfxVolume =
            this.clampVolume(value);
        this.save();
    }

    static setMuted(
        muted: boolean,
    ): void {
        this.ensureLoaded();
        this.state.muted = muted;
        this.save();
    }

    static toggleMuted(): boolean {
        this.setMuted(
            !this.isMuted(),
        );

        return this.state.muted;
    }

    private static clampVolume(
        value: number,
    ): number {
        if (!Number.isFinite(value)) {
            return 0;
        }

        return Math.max(
            0,
            Math.min(
                1,
                value,
            ),
        );
    }

    private static save(): void {
        const data:
            GameAudioSaveData = {
                version: 1,
                ...this.state,
            };

        sys.localStorage.setItem(
            this.STORAGE_KEY,
            JSON.stringify(data),
        );
    }
}
