import { League, Season, Team } from "../db";

export interface TeamHeaderDetails {
  id: Team["id"];
  name: Team["name"];
  team_logo: Team["team_logo"];
  latest_league_name: League["name"];
  latest_season_name: Season["name"];
  external_team_id?: string | null;
}
