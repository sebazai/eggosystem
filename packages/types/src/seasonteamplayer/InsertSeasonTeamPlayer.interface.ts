import type { SeasonTeamPlayer } from "../db";

export interface InsertSeasonTeamPlayer {
  season_id: SeasonTeamPlayer["season_id"];
  team_id: SeasonTeamPlayer["team_id"];
  steam_id: SeasonTeamPlayer["steam_id"];
  role?: "primary" | "substitute";
}
