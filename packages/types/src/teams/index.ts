import { League, Map, Match, Season, SteamPlayer, Team } from "../db";

export interface TeamStats extends Team {
  matches_played: number;
  wins: number;
  losses: number;
  ties: number;
  win_percentage: number;
  league_name: League["name"];
  league_id: League["id"];
  season_id: Season["id"];
  season_name: Season["name"];
}

export interface TeamPlayerStats {
  steam_id: SteamPlayer["steam_id"];
  nickname: SteamPlayer["nickname"];
  team_name: Team["name"];
  team_logo: Team["team_logo"];
  matches_played: number;
  kills: number;
  deaths: number;
  assists: number;
  flash_assists: number;
  awp_kills: number;
  headshots: number;
  first_kills: number;
  first_deaths: number;
  utility_damage: number;
  total_damage: number;
  enemies_flashed: number;
  mates_flashed: number;
  adr: number;
  kana_rating: number;
  hs_percent: number;
  kd: number;
}

export interface TeamMatch {
  match_id: Match["id"];
  date: string;
  maps: string;
  team_id: number;
  team_name: string;
  team_logo: string;
  opponent_id: number;
  opponent_name: string;
  opponent_logo: string;
  team_score: number;
  opponent_score: number;
  result: string;
}

export interface TeamMapStats {
  map_id: number;
  map_name: string;
  matches_played: number;
  wins: number;
  losses: number;
  win_percentage: number;
  avg_score: string;
  avg_opponent_score: string;
  avg_rating: string;
}

export interface TeamMapStatsResult {
  map_id: Map["id"];
  map_name: Map["name"];
  matches_played: number;
  wins: number;
  losses: number;
  avg_score: string;
  avg_opponent_score: string;
  avg_rating: string;
}

export interface TeamMatch {
  match_id: number;
  date: string;
  team_id: number;
  team_name: string;
  team_logo: string;
  opponent_id: number;
  opponent_name: string;
  opponent_logo: string;
  team_score: number;
  opponent_score: number;
  maps: string;
  result: string;
}

export interface TeamMapStats {
  map_id: number;
  map_name: string;
  matches_played: number;
  wins: number;
  losses: number;
  win_percentage: number;
  avg_score: string;
  avg_opponent_score: string;
  avg_rating: string;
}

export interface TeamDetails {
  team: TeamStats;
  players: TeamPlayerStats[];
  matches: TeamMatch[];
  map_stats?: TeamMapStats[];
}
