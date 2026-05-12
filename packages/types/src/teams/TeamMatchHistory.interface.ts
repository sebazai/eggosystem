import { League, Match, MatchGame, Season } from "../db";
import type { MatchTeamSide } from "../matches/MatchTeamSide.types";

export interface TeamMatchHistory {
  match_game_id?: MatchGame["id"];
  match_id: Match["id"];
  season_name: Season["full_name"];
  league_name: League["name"];
  date: string;
  maps: string;
  best_of: number;
  team_id: number;
  team_name: string;
  team_logo: string;
  opponent_id: number;
  opponent_name: string;
  opponent_logo: string;
  team_score: number;
  opponent_score: number;
  /** MatchTeams.match_side for the perspective team (`null` if unknown). */
  team_side: MatchTeamSide;
  /** MatchTeams.match_side for the opposing team (`null` if unknown). */
  opponent_side: MatchTeamSide;
  result: string;
}
