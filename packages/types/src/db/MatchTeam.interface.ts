import type { League, Season, Team, Match } from "@eggosystem/types";
import type { MatchTeamSide } from "../matches/MatchTeamSide.types";

export interface MatchTeam {
  match_id: Match["id"];
  team_id: Team["id"];
  season_id: Season["id"];
  league_id: League["id"];
  match_side: MatchTeamSide;
}
