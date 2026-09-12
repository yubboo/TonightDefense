/**
 * @architecture TonightDefense V1.0
 * @owner battle
 * @module objective
 */
import {
    Vec2,
} from 'cc';

export type DefenseObjectiveKind =
    | 'tower'
    | 'wall'
    | 'princess';

/**
 * 伙伴复活通道回调。
 * 防御塔拥有“消耗多少生命、复活进度多少”的权威状态；
 * 伙伴控制器只负责把进度表现成角色血量与能量传输特效。
 */
export interface CompanionReviveCallbacks {
    onProgress:
        (progress: number) => void;

    onComplete:
        () => void;

    onCancel?:
        () => void;
}

export interface DefenseObjectiveProvider {
    getActiveObjective:
        () =>
            DefenseObjectiveKind | null;

    getObjectivePosition:
        (
            kind:
                DefenseObjectiveKind,
        ) => Vec2;

    takeDamage:
        (
            kind:
                DefenseObjectiveKind,
            amount: number,
        ) => void;

    isGameOver:
        () => boolean;

    requestCompanionRevive:
        (
            companionId: string,
            callbacks:
                CompanionReviveCallbacks,
        ) => boolean;
}

export class DefenseObjectiveService {
    private static provider:
        DefenseObjectiveProvider | null =
        null;

    static configure(
        provider:
            DefenseObjectiveProvider,
    ): void {
        this.provider = provider;
    }

    static clear(): void {
        this.provider = null;
    }

    static getActiveObjective():
        DefenseObjectiveKind | null {
        return (
            this.provider
                ?.getActiveObjective() ??
            null
        );
    }

    static getObjectivePosition(
        kind:
            DefenseObjectiveKind,
    ): Vec2 {
        return (
            this.provider
                ?.getObjectivePosition(
                    kind,
                ) ??
            new Vec2()
        );
    }

    static takeDamage(
        kind:
            DefenseObjectiveKind,
        amount: number,
    ): void {
        this.provider
            ?.takeDamage(
                kind,
                amount,
            );
    }

    static get isGameOver(): boolean {
        return (
            this.provider
                ?.isGameOver() ??
            false
        );
    }

    static requestCompanionRevive(
        companionId: string,
        callbacks:
            CompanionReviveCallbacks,
    ): boolean {
        return (
            this.provider
                ?.requestCompanionRevive(
                    companionId,
                    callbacks,
                ) ??
            false
        );
    }
}
