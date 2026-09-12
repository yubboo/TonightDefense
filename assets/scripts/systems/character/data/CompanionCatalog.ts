/**
 * @architecture TonightDefense V1.0
 * @owner character
 * @module data
 *
 * Compatibility facade:
 *
 * 旧代码继续使用 CompanionDefinition，
 * 但真正人物数据已经统一迁到 CharacterCatalog。
 */
import {
    CharacterDefinition,
    getCharacterById,
    getCompanionCandidates,
} from './CharacterCatalog';

import {
    getProfessionById,
} from '../../profession/definition/ProfessionCatalog';

export interface CompanionDefinition
extends CharacterDefinition {
    role: string;
}

function toCompanionDefinition(
    character:
        CharacterDefinition,
): CompanionDefinition {
    const profession =
        getProfessionById(
            character.professionId,
        );

    return {
        ...character,
        role:
            profession.roleLabel,
    };
}

export const COMPANION_CATALOG:
    readonly CompanionDefinition[] =
    getCompanionCandidates()
        .map(
            toCompanionDefinition,
        );

export function getCompanionById(
    id: string,
): CompanionDefinition | undefined {
    const character =
        getCharacterById(id);

    if (
        !character ||
        !character.canBeCompanion
    ) {
        return undefined;
    }

    return toCompanionDefinition(
        character,
    );
}
