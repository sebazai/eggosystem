import { type Map, SteamPlayer } from "../db";

export interface PlayerMapStats {
  steam_id: SteamPlayer["steam_id"];
  nickname: SteamPlayer["nickname"];
  map_id: Map["id"];
  map_name: Map["name"];
  maps_played: number;
  kills: number;
  deaths: number;
  assists: number;
  flash_assists: number;
  awp_kills: number;
  utility_damage: number;
  headshots: number;
  first_kills: number;
  first_deaths: number;
  adr: number;
  kana_rating: number;
  hs_percent: number;
  clutches_won: number;
  clutches_lost: number;
  kast: number;
  enemies_flashed: number;
  mates_flashed: number;
  self_flashes: number;
  total_damage: number;
  flashes_thrown: number;
  total_ef_duration: number;
  kd: number;
  kills_t: number;
  kills_ct: number;
  multikill_2k: number;
  multikill_3k: number;
  multikill_4k: number;
  multikill_5k: number;
  rounds_played: number;
  wins: number;
  losses: number;
  win_percentage: number;
  // Trade statistics
  trades: number;
  trade_attempts: number;
  trade_opportunities: number;
  // Counter-strafing statistics
  counter_strafing_percentage: number;
  // First kill/death statistics
  first_kills_ct: number;
  first_deaths_ct: number;
  first_kills_t: number;
  first_deaths_t: number;
  // Flash quality statistics
  avg_enemy_flash_duration: number;
  avg_teammate_flash_duration: number;
  // Aim statistics
  crosshair_placement: number;
  time_to_damage: number;
}
