import { League, Season, Team } from "../db";

export interface OrganizationTeamTrophies {
  team_id: Team["id"];
  season_id: Season["id"];
  league_id: League["id"];
  season_name: Season["full_name"];
  league_name: League["name"];
  placement: number;
}
