import { Map, Season, Team } from "../db";

export interface TeamPlantStat {
  season_id: Season["id"];
  season_name: Season["name"];
  map_id: Map["id"];
  map_name: Map["name"];
  team_id: Team["id"];
  team_name: Team["name"];
  // Offensive plants (when team is T-side)
  planted_a_site: number;
  planted_b_site: number;
  no_plants: number;
  // Defensive (when enemy is T-side)
  enemy_planted_a_site: number;
  enemy_planted_b_site: number;
  enemy_no_plants: number;
}
