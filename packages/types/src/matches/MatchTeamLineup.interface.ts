import { Team, SteamPlayer, SeasonPlayerRank } from "../db";
import type { MatchTeamSide } from "./MatchTeamSide.types";

/**
 * Raw database result for team lineup queries
 * Represents the structure returned directly from SQL queries
 */
export interface MatchTeamLineupRaw {
  team_id: Team["id"];
  team_name: Team["name"];
  team_logo: Team["team_logo"];
  match_side: MatchTeamSide;
  steam_id: SteamPlayer["steam_id"];
  player_name: SteamPlayer["nickname"];
  player_nickname: SteamPlayer["nickname"];
  cs2_rank: SeasonPlayerRank["cs2_rank"];
  faceit_level: SeasonPlayerRank["faceit_level"];
  faceit_elo: SeasonPlayerRank["faceit_elo"];
  cs_hours: SeasonPlayerRank["cs_hours"];
  games_played: number; // Calculated field
  maps_played: number; // Calculated field
  kana_rating: number; // Calculated field - average rating
}

/**
 * Team lineup data for match display
 * Uses indexed access types for direct database fields
 */
export interface MatchTeamLineup {
  id: Team["id"];
  name: Team["name"];
  logo: Team["team_logo"];
  side: MatchTeamSide;
  players: Array<{
    steam_id: SteamPlayer["steam_id"];
    name: string; // Not directly mapped to database field
    nickname: SteamPlayer["nickname"];
    cs2_rank: SeasonPlayerRank["cs2_rank"];
    faceit_level: SeasonPlayerRank["faceit_level"];
    faceit_elo: SeasonPlayerRank["faceit_elo"];
    cs_hours: SeasonPlayerRank["cs_hours"];
    games_played: number; // Calculated field
    maps_played: number; // Calculated field
    kana_rating: number; // Calculated field - average rating
  }>;
}
