// RegistrationDraft.interface.ts
// Shared type for registration drafts stored in Redis and used in dashboard admin views

export interface RegistrationDraft {
  team_name?: string;
  captain_nickname?: string;
  co_captain_nickname?: string;
  season_platform?: string;
  players?: { steam_id: string; nickname: string }[];
  teamId?: number;
  newTeam?: { name: string };
  teamExternalId?: string;
}
