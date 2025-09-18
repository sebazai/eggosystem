import { SteamPlayer, Team } from "../db";
import { Nullable } from "../utils";

export interface PlayerStatsTable {
  steam_id: SteamPlayer["steam_id"];
  nickname: SteamPlayer["nickname"];
  team_name?: Team["name"];
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
  adr: Nullable<number>;
  kana_rating: Nullable<number>;
  hs_percent: Nullable<number>;
  kd: Nullable<number>;
}
