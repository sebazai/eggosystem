import { SteamPlayer, PlayerStats } from "../db";

export interface PlayerStatistics {
  steam_id: SteamPlayer["steam_id"];
  nickname: SteamPlayer["nickname"];
  maps_played: number; // Calculated field, no direct mapping
  kills: PlayerStats["kills"];
  assists: PlayerStats["assists"];
  deaths: PlayerStats["deaths"];
  adr: PlayerStats["adr"];
  kana_rating: PlayerStats["kana_rating"];
  hs_percent: PlayerStats["hs_percent"];
  kd: number; // Calculated field, no direct mapping
  rounds_played: number; // Calculated field, no direct mapping
}
