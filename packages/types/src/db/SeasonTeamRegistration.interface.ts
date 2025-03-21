import type { Nullable, Player, Season, Team } from "@eggosystem/types";

export interface SeasonTeamRegistration {
  season_id: Season["id"];
  team_id: Team["id"];
  captain_steam_id?: Nullable<Player["steam_id"]>;
  co_captain_steam_id?: Nullable<Player["steam_id"]>;
  defects?: Nullable<string>;
  ticket?: Nullable<string>;
  approved: boolean; // Not nullable, defaults to false (0)
  notification_sent: boolean; // Not nullable, defaults to false (0)
  external_platform_id?: Nullable<string>;
}
