import { League, SeasonLeague, SeasonLeagueExternalId } from "../db";

export interface StandingsLeagues extends SeasonLeagueExternalId {
  league_name: League["name"];
  tier: SeasonLeague["tier"];
}
