import {
    WarehouseRepository,
} from '../../warehouse/repository/WarehouseRepository';

import {
    RewardService,
} from '../../reward/RewardService';

import {
    STAGE_CHEST_REWARDS,
    StageChestStar,
} from '../../reward/data/StageChestRewardConfig';

export interface StageChestState {
    chapterNumber: number;
    unlockedStars: number;
    claimedStars: StageChestStar[];
}

export interface StageChestActionResult {
    ok: boolean;
    message: string;
}

/**
 * LevelSystem / 星级阶段宝箱。
 *
 * - LevelSystem 决定当前关卡解锁几星。
 * - RewardSystem 决定奖励如何发。
 * - WarehouseSystem 负责保存领取状态。
 */
export class StageChestService {
    static getState(
        chapterNumber:
            number,
    ): StageChestState {
        const chapter =
            Math.max(
                1,
                Math.floor(
                    chapterNumber,
                ),
            );

        const persisted =
            WarehouseRepository
                .loadStageChest(
                    chapter,
                );

        return {
            chapterNumber:
                chapter,

            unlockedStars:
                persisted
                    .unlockedStars,

            claimedStars:
                persisted
                    .claimedStars
                    .filter(
                        (
                            value,
                        ):
                            value is
                                StageChestStar =>
                            value === 1 ||
                            value === 2 ||
                            value === 3,
                    ),
        };
    }

    static unlockStars(
        chapterNumber:
            number,
        stars:
            number,
    ): StageChestState {
        const state =
            this.getState(
                chapterNumber,
            );

        state.unlockedStars =
            Math.max(
                state
                    .unlockedStars,
                Math.min(
                    3,
                    Math.max(
                        0,
                        Math.floor(
                            stars,
                        ),
                    ),
                ),
            );

        this.save(
            state,
        );

        return state;
    }

    static claim(
        chapterNumber:
            number,
        star:
            StageChestStar,
    ): StageChestActionResult {
        const state =
            this.getState(
                chapterNumber,
            );

        if (
            state
                .unlockedStars <
            star
        ) {
            return {
                ok: false,
                message:
                    `${star}星宝箱尚未解锁`,
            };
        }

        if (
            state
                .claimedStars
                .indexOf(
                    star,
                ) >=
            0
        ) {
            return {
                ok: false,
                message:
                    `${star}星宝箱已经领取`,
            };
        }

        RewardService.grant(
            STAGE_CHEST_REWARDS[
                star
            ],
            star === 1
                ? 'stage-chest-1'
                : star === 2
                    ? 'stage-chest-2'
                    : 'stage-chest-3',
        );

        state
            .claimedStars
            .push(
                star,
            );

        this.save(
            state,
        );

        return {
            ok: true,
            message:
                `${star}星阶段宝箱领取成功`,
        };
    }

    private static save(
        state:
            StageChestState,
    ): void {
        WarehouseRepository
            .saveStageChest(
                state
                    .chapterNumber,
                {
                    unlockedStars:
                        state
                            .unlockedStars,

                    claimedStars:
                        state
                            .claimedStars,
                },
            );
    }
}
