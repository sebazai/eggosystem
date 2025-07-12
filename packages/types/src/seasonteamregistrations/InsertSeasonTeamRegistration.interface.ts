import type { SeasonTeamRegistration, SteamPlayer } from "@eggosystem/types";

export interface InsertSeasonTeamRegistration {
  captain_steam_id: SteamPlayer["steam_id"];
  co_captain_steam_id: SteamPlayer["steam_id"];
  external_platform_id: SeasonTeamRegistration["external_platform_id"];
  terms_and_conditions_approved: SeasonTeamRegistration["terms_and_conditions_approved"];
}
