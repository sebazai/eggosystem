import type { MatchGame, SteamPlayer } from "@eggosystem/types";

export interface PlayerRoundImpact {
  id: number;
  match_game_id: MatchGame["id"];
  round_number: number;
  player_steam_id: SteamPlayer["steam_id"];
  kills: number;
  assists: number;
  first_kill: boolean;
  trades: number;
  damage_dealt: number; // Damage dealt this round (not ADR)
  flash_assists: number;
  first_kill_flash_assists: number;
  impact_score: number;
  entry_kill: boolean;
  exit_kill: boolean;
  bomb_planted: boolean;
  bomb_defused: boolean;
  bomb_exploded: boolean;
  kill_opponent_value: number;
  win_prob_impact: number;
  trade_denials: number;
  failed_trades: number;
  trade_efficiency: number;
}
