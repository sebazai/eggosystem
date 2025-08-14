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
  // CT and T side statistics
  ct_win_percentage: number;
  t_win_percentage: number;
  ct_kd: string;
  t_kd: string;
  kills_ct: number;
  deaths_ct: number;
  kills_t: number;
  deaths_t: number;
}
