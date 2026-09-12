/**
 * @architecture TonightDefense V1.0
 * @owner character
 * @module party
 * @migratedFrom party/PartyState.ts
 */
import { GAME_CONSTANTS } from '../../../../shared/GameConstants';
import { PartyMemberType, ProgressPhase } from '../../../../shared/GameEnums';

export interface PartyMember {
    uid: string;
    type: PartyMemberType;
    name: string;
    catalogId?: string;
}

export class PartyState {
    private members: PartyMember[] = [];

    resetHumanPlayers(playerNames: string[]): void {
        const safeNames = playerNames
            .slice(0, GAME_CONSTANTS.PARTY_MAX_SIZE)
            .map((name, index) => name || `玩家${index + 1}`);

        this.members = safeNames.map((name, index) => ({
            uid: `human_${index + 1}`,
            type: PartyMemberType.Human,
            name,
        }));
    }

    getMembers(): readonly PartyMember[] {
        return this.members;
    }

    get size(): number {
        return this.members.length;
    }

    get emptySlots(): number {
        return Math.max(0, GAME_CONSTANTS.PARTY_MAX_SIZE - this.members.length);
    }

    get isFull(): boolean {
        return this.members.length >= GAME_CONSTANTS.PARTY_MAX_SIZE;
    }

    get phase(): ProgressPhase {
        return this.isFull ? ProgressPhase.Build : ProgressPhase.Recruit;
    }

    hasCompanion(catalogId: string): boolean {
        return this.members.some(
            (member) =>
                member.type === PartyMemberType.Companion &&
                member.catalogId === catalogId,
        );
    }

    addCompanion(catalogId: string, name: string): boolean {
        if (this.isFull || this.hasCompanion(catalogId)) {
            return false;
        }

        this.members.push({
            uid: `companion_${catalogId}_${this.members.length + 1}`,
            type: PartyMemberType.Companion,
            name,
            catalogId,
        });

        return true;
    }
}
