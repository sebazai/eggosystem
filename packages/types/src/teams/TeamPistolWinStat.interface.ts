import { Map, Season, Team } from "../db";

export interface TeamPistolWinStat {
  season_id: Season["id"];
  season_name: Season["name"];
  map_id: Map["id"];
  map_name: Map["name"];
  team_id: Team["id"];
  team_name: Team["name"];
  pistol_rounds_played: number;
  pistol_rounds_won: number;
  pistol_win_percentage: number;
}
