import { SteamPlayer, SeasonPlayerRank } from "../db";

export interface Player {
  id: number;
  steamId: SteamPlayer["steam_id"];
  name: SteamPlayer["nickname"];
  nickname: SteamPlayer["nickname"];
  avatar?: string;
  isHotstreak?: boolean;
  isColdstreak?: boolean;
  stats?: {
    rating?: number; // Calculated field, no direct mapping - may not be available
    kd?: number; // Calculated field, no direct mapping - may not be available
    adr?: number; // Calculated field, no direct mapping - may not be available
    hs?: number; // Calculated field, no direct mapping - may not be available
    games_played?: number; // Calculated field, no direct mapping
    maps_played?: number; // Calculated field, no direct mapping
    kana_rating?: number; // Calculated field - average rating
    faceit_level?: SeasonPlayerRank["faceit_level"];
    faceit_elo?: SeasonPlayerRank["faceit_elo"];
    cs2_rank?: SeasonPlayerRank["cs2_rank"];
    cs_hours?: SeasonPlayerRank["cs_hours"];
  };
}
