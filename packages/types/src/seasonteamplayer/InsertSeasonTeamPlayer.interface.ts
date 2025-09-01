import type { SteamPlayer } from "../db";

export interface InsertSeasonTeamPlayer {
  steam_id: SteamPlayer["steam_id"];
  role?: "primary" | "substitute";
  match_id?: number;
}
