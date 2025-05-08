import { Match, MatchGame } from "../db";

export interface TeamMatchHistory {
  game_id?: MatchGame["id"];
  match_id: Match["id"];
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
  result: string;
}
