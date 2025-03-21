import type { League, Season, Team, Match } from "@eggosystem/types";

export interface MatchTeam {
  match_id: Match["id"];
  team_id: Team["id"];
  season_id: Season["id"];
  league_id: League["id"];
}
