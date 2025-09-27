import { League, Season, SeasonLeague, SeasonLeagueExternalId } from "../db";

export interface StandingsLeagues extends SeasonLeagueExternalId {
  league_name: League["name"];
  tier: SeasonLeague["tier"];
  is_round_robin_bo2_as_2xbo1: Season["is_round_robin_bo2_as_2xbo1"];
}
