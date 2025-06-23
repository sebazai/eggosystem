import { Map, Season, Team } from "../db";

export interface TeamRetakeStats {
  season_id: Season["id"];
  season_name: Season["name"];
  map_id: Map["id"];
  map_name: Map["name"];
  team_id: Team["id"];
  team_name: Team["name"];
  // Afterplants (when team is T-side)
  afterplant_total: number;
  afterplant_won: number;
  afterplant_win_percentage: number;
  afterplant_a_total: number;
  afterplant_a_won: number;
  afterplant_b_total: number;
  afterplant_b_won: number;
  // Retakes (when team is CT-side)
  retake_total: number;
  retake_won: number;
  retake_win_percentage: number;
  retake_a_total: number;
  retake_a_won: number;
  retake_b_total: number;
  retake_b_won: number;
}
