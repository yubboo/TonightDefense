import {
    GameplayModeDefinition,
    GameplayModeId,
} from './GameplayModeTypes';

const MODES:
    Readonly<Record<GameplayModeId, GameplayModeDefinition>> = {
        campaign: {
            id: 'campaign',
            name: '主线闯关',
            description: '每个大关40个小关，最终小关进入Boss阶段。',
            consumesStamina: true,
            supportsWaveCombat: true,
            supportsStageRewards: true,
            unlockHint: '默认开放',
        },
        challenge: {
            id: 'challenge',
            name: '挑战',
            description: '特殊规则、高难度或限定阵容玩法入口。',
            consumesStamina: true,
            supportsWaveCombat: true,
            supportsStageRewards: true,
            unlockHint: '后续按主线进度开放',
        },
        sweep: {
            id: 'sweep',
            name: '扫荡',
            description: '对已满足条件的关卡快速结算奖励。',
            consumesStamina: true,
            supportsWaveCombat: false,
            supportsStageRewards: false,
            unlockHint: '通关对应关卡后开放',
        },
        territory: {
            id: 'territory',
            name: '领地',
            description: '长期建设、资源产出与防御设施相关玩法入口。',
            consumesStamina: false,
            supportsWaveCombat: false,
            supportsStageRewards: false,
            unlockHint: '后续功能开放',
        },
        event: {
            id: 'event',
            name: '活动',
            description: '限时活动与特殊奖励玩法统一入口。',
            consumesStamina: true,
            supportsWaveCombat: true,
            supportsStageRewards: true,
            unlockHint: '按活动配置开放',
        },
    };

export class GameplayModeCatalog {
    static get(id: GameplayModeId): GameplayModeDefinition {
        return MODES[id];
    }

    static getAll(): readonly GameplayModeDefinition[] {
        return [
            MODES.campaign,
            MODES.challenge,
            MODES.sweep,
            MODES.territory,
            MODES.event,
        ];
    }
}
