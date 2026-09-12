/**
 * @architecture TonightDefense V2.0
 * @owner gameplay
 * @module mode
 */
export type GameplayModeId =
    | 'campaign'
    | 'challenge'
    | 'sweep'
    | 'territory'
    | 'event';

export interface GameplayModeDefinition {
    id: GameplayModeId;
    name: string;
    description: string;
    consumesStamina: boolean;
    supportsWaveCombat: boolean;
    supportsStageRewards: boolean;
    unlockHint: string;
}
