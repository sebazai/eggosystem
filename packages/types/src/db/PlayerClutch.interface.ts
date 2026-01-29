import type { MatchGame, SteamPlayer } from "@eggosystem/types";

export interface PlayerClutch {
  id: number;
  match_game_id: MatchGame["id"];
  round_number: number;
  player_steam_id: SteamPlayer["steam_id"];
  player_team: "CT" | "T";
  won: boolean;
  clutch_start_enemies: number; // 1-5
  kills: number;
  end_info: string; // e.g. "Lost", "Kill"
}
