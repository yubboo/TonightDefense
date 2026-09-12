import {
    Node,
} from 'cc';

import {
    CharacterDefinition,
} from '../../character/data/CharacterCatalog';

import {
    CharacterCombatant,
} from '../../character/stats/CharacterCombatant';

import {
    ProfessionDefinition,
} from '../../profession/definition/ProfessionTypes';

export interface HeroSkillActor {
    actorId: string;
    controlMode: 'player' | 'ai';
    definition: CharacterDefinition;
    profession: ProfessionDefinition;
    node: Node;
    combatant: CharacterCombatant;
}
