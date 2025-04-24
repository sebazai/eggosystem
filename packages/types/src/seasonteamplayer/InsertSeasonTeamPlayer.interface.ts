import type { SeasonTeamPlayer } from "../db";

export interface InsertSeasonTeamPlayer {
  steam_id: SeasonTeamPlayer["steam_id"];
  role?: "primary" | "substitute";
}
