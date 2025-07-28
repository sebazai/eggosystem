import { SeasonLeagueTeam, Team } from "../db";

export interface TeamsByLeague {
  id: Team["id"];
  name: Team["name"];
  league_id: SeasonLeagueTeam["league_id"];
  season_id: SeasonLeagueTeam["season_id"];
  team_logo: Team["team_logo"];
}
