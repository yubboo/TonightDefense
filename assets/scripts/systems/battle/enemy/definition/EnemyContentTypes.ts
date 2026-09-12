import {
    ContentImplementationStatus,
} from '../../../../shared/content/ContentStatus';

import {
    EnemyArchetype,
    EnemyRank,
} from '../EnemyTypes';

export type EnemyContentId =
    | 'slime'
    | 'goblin'
    | 'skeleton_soldier'
    | 'small_bat'
    | 'wolf_rider'
    | 'potion_witch'
    | 'stone_guardian'
    | 'orc_chieftain'
    | 'flame_dragon'
    | 'abyss_golem'
    | 'undead_king';

export interface EnemyContentDefinition {
    id: EnemyContentId;
    name: string;
    archetype: EnemyArchetype;
    rank: EnemyRank;
    tags: readonly string[];
    resourceRoot: string;
    status: ContentImplementationStatus;
    designSource: string;
}
