import { type Map } from "../db";

export interface TeamMapStats {
  map_id: Map["id"];
  map_name: Map["name"];
  maps_played: number;
  wins: number;
  losses: number;
  win_percentage: number;
  avg_score: number;
  avg_opponent_score: number;
  // CT and T side statistics
  ct_win_percentage: number;
  t_win_percentage: number;
  ct_kd: number;
  t_kd: number;
  kills_ct: number;
  deaths_ct: number;
  kills_t: number;
  deaths_t: number;
  // Openings statistics
  first_kills: number;
  first_deaths: number;
  first_kills_t: number;
  first_deaths_t: number;
  first_kills_ct: number;
  first_deaths_ct: number;
  // 5v4/4v5 advantage stats (from first kill)
  fk_5v4_won: number; // Got first kill and won round
  fk_5v4_total: number; // Got first kill total
  fk_4v5_won: number; // Lost first kill but won round
  fk_4v5_total: number; // Lost first kill total
  // 5v4/4v5 advantage stats split by side
  fk_5v4_won_ct: number; // Got first kill and won round (CT side)
  fk_5v4_total_ct: number; // Got first kill total (CT side)
  fk_5v4_won_t: number; // Got first kill and won round (T side)
  fk_5v4_total_t: number; // Got first kill total (T side)
  fk_4v5_won_ct: number; // Lost first kill but won round (CT side)
  fk_4v5_total_ct: number; // Lost first kill total (CT side)
  fk_4v5_won_t: number; // Lost first kill but won round (T side)
  fk_4v5_total_t: number; // Lost first kill total (T side)
}
