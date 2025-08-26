import { SeasonLeagueExternalId, League } from "@eggosystem/types";

export interface FaceitLink {
  id: SeasonLeagueExternalId["id"];
  season_id: SeasonLeagueExternalId["season_id"];
  league_id: SeasonLeagueExternalId["league_id"];
  league_name: League["name"];
  external_id: SeasonLeagueExternalId["external_id"];
  external_league_name: SeasonLeagueExternalId["external_league_name"];
  type: SeasonLeagueExternalId["type"];
  sort_priority: League["sort_priority"];
  faceit_url: string;
}
