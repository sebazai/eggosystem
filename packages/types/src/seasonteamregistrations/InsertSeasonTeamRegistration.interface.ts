import type { SeasonTeamRegistration } from "@eggosystem/types";

export interface InsertSeasonTeamRegistration {
  captain_steam_id: SeasonTeamRegistration["captain_steam_id"];
  co_captain_steam_id: SeasonTeamRegistration["co_captain_steam_id"];
  external_platform_id: SeasonTeamRegistration["external_platform_id"];
}
