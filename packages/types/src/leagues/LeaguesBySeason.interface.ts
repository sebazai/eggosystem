import { League, Season, SeasonLeague } from "../db";

export interface LeaguesBySeason {
  id: League["id"];
  name: League["name"];
  season_id: Season["id"];
  tier: SeasonLeague["tier"];
}
