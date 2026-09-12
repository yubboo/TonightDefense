/**
 * GameplaySystem 只拥有“玩法规则组合”。
 * 具体波次仍由 LevelSystem 管理；
 * 伤害与敌人行为仍由 BattleSystem 管理。
 */
export interface GameplayRuleSet {
    allowCompanions: boolean;
    allowRecruitment: boolean;
    allowSkillChoices: boolean;
    allowStageChest: boolean;
    failureOnPrincessHit: boolean;
}

export const CAMPAIGN_RULES:
    GameplayRuleSet = {
        allowCompanions: true,
        allowRecruitment: true,
        allowSkillChoices: true,
        allowStageChest: true,
        failureOnPrincessHit: true,
    };
