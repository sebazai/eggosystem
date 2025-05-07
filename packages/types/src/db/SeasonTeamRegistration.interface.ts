import type { Nullable, SteamPlayer, Season, Team } from "@eggosystem/types";

export interface SeasonTeamRegistration {
  season_id: Season["id"];
  team_id: Team["id"];
  captain_steam_id?: Nullable<SteamPlayer["steam_id"]>;
  co_captain_steam_id?: Nullable<SteamPlayer["steam_id"]>;
  approved: boolean; // Not nullable, defaults to false (0)
  external_platform_id?: Nullable<string>;
  terms_and_conditions_approved: boolean;
}
