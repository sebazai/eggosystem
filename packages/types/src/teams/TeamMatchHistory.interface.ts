import { Match } from "../db";

export interface TeamMatchHistory {
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
