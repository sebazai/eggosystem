import { SteamPlayer } from "../db";

export interface PlayerStatsTable {
  steam_id: SteamPlayer["steam_id"];
  nickname: SteamPlayer["nickname"];
  maps_played: number;
  kills: number;
  assists: number;
  deaths: number;
  flash_assists: number;
  awp_kills: number;
  utility_damage: number;
  headshots: number;
  first_kills: number;
  first_deaths: number;
  adr: number;
  kana_rating: number;
  hs_percent: number;
  kd: number;
}
