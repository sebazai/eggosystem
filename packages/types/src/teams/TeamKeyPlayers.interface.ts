import { SteamPlayer } from "../db";

export interface TeamKeyPlayers {
  steam_id: SteamPlayer["steam_id"];
  nickname: SteamPlayer["nickname"];
  games_played: number;
  kdr: number;
  kdiff: number;
  adr: number;
  kana_rating: number;
}
