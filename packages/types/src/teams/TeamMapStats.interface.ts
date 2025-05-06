import { type Map } from "../db";

export interface TeamMapStats {
  map_id: Map["id"];
  map_name: Map["name"];
  maps_played: number;
  wins: number;
  losses: number;
  win_percentage: number;
  avg_score: string;
  avg_opponent_score: string;
}
