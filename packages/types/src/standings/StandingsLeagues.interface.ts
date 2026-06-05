import {
  CSSeasonSettingsFields,
  League,
  SeasonLeague,
  SeasonLeagueExternalId
} from "../db";

export interface StandingsLeagues extends SeasonLeagueExternalId {
  league_name: League["name"];
  tier: SeasonLeague["tier"];
  is_round_robin_bo2_as_2xbo1: CSSeasonSettingsFields["is_round_robin_bo2_as_2xbo1"];
}
