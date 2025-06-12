import { SteamPlayer, Season } from "../db";

export interface PlayerStatsForLatestSeason {
  steam_id: SteamPlayer["steam_id"];
  nickname: SteamPlayer["nickname"];
  latest_season_id: Season["id"];
  avg_kana_rating: number;
  kpd: number | null;
  adr: number;
  level: number;
}
