/**
 * @architecture TonightDefense V1.0
 * @owner progression
 * @module recruitment
 *
 * 招募池来自统一 CharacterCatalog。
 * 本局已经选成主角的人物自动排除。
 */
import {
    CharacterDefinition,
    getCompanionCandidates,
} from '../../character/data/CharacterCatalog';

import {
    PartyState,
} from '../../character/party/PartyState';

import {
    GAME_CONSTANTS,
} from '../../../../shared/GameConstants';

import {
    RandomService,
} from './RandomService';

import {
    HeroSelectionState,
} from '../../character/selection/HeroSelectionState';

export class RecruitService {
    constructor(
        private readonly party:
            PartyState,
    ) {}

    rollOptions():
        CharacterDefinition[] {
        if (
            this.party.isFull
        ) {
            return [];
        }

        const selectedHeroId =
            HeroSelectionState
                .current
                ?.id;

        const candidates =
            getCompanionCandidates()
                .filter(
                (
                    item,
                ) =>
                    !this.party
                        .hasCompanion(
                            item.id,
                        ) &&
                    item.id !==
                        selectedHeroId,
            );

        return RandomService
            .pickUnique(
                candidates,
                GAME_CONSTANTS
                    .RECRUIT_OPTION_COUNT,
            );
    }

    recruit(
        companion:
            CharacterDefinition,
    ): boolean {
        if (
            HeroSelectionState
                .isSelected(
                    companion.id,
                )
        ) {
            return false;
        }

        return this.party
            .addCompanion(
                companion.id,
                companion.name,
            );
    }
}
