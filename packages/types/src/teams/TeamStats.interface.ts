import { League, Season, Team } from "../db";

export interface TeamStats {
  id: Team["id"];
  name: Team["name"];
  team_logo: Team["team_logo"];
  wins: number;
  losses: number;
  matches_played: number;
  win_percentage: number;
  latest_league_name: League["name"];
  latest_season_name: Season["name"];
}
