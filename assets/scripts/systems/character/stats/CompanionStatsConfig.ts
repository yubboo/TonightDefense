/**
 * @architecture TonightDefense V1.0
 * @owner character
 * @module stats
 *
 * Compatibility facade:
 * 历史代码曾为“伙伴”维护第二套 HP / 防御 / 移速表。
 * v0.4.12 起，所有英雄统一使用 CharacterCatalog -> ProfessionCatalog。
 * 玩家控制主角与 AI 控制伙伴的区别只在控制方式，不再复制职业基础属性。
 */
import {
    CompanionAttackMode,
} from '../../battle/data/BattleLayoutConfig';

import {
    getCharacterById,
} from '../data/CharacterCatalog';

import {
    getProfessionById,
} from '../../profession/definition/ProfessionCatalog';

export interface CompanionStatProfile {
    maxHp: number;
    defense: number;
    moveSpeed: number;
}

export function getCompanionStatProfile(
    companionId: string,
    _mode: CompanionAttackMode,
): CompanionStatProfile {
    const character =
        getCharacterById(
            companionId,
        );

    if (character) {
        const stats =
            getProfessionById(
                character
                    .professionId,
            ).baseStats;

        return {
            maxHp: stats.maxHp,
            defense: stats.defense,
            moveSpeed: stats.moveSpeed,
        };
    }

    return {
        maxHp: 160,
        defense: 3,
        moveSpeed: 78,
    };
}
