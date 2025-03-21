import type { SeasonTeamRegistration } from "@eggosystem/types";

export interface InsertSeasonTeamRegistration {
  season_id: SeasonTeamRegistration["season_id"];
  team_id: SeasonTeamRegistration["team_id"];
  captain_steam_id: SeasonTeamRegistration["captain_steam_id"];
  co_captain_steam_id: SeasonTeamRegistration["co_captain_steam_id"];
  external_platform_id: SeasonTeamRegistration["external_platform_id"];
  defects?: SeasonTeamRegistration["defects"];
  ticket?: SeasonTeamRegistration["ticket"];
  approved?: SeasonTeamRegistration["approved"];
  notification_sent?: SeasonTeamRegistration["notification_sent"];
}
