import { Map, MatchGame, TeamGameScore } from "@eggosystem/types";
import type { MatchTeamSide } from "./MatchTeamSide.types";

export interface MatchMapsPlayed {
  id: MatchGame["id"];
  match_id: MatchGame["match_id"];
  map_order: MatchGame["map_order"];
  map_name: Map["name"];
  demofile: MatchGame["demofile"];
  /** Team id for `team1_*` columns (stable tie-break when sides are unknown). */
  team1_id: TeamGameScore["team_id"];
  /** Team id for `team2_*` columns (stable tie-break when sides are unknown). */
  team2_id: TeamGameScore["team_id"];
  team1_score: TeamGameScore["score"];
  team2_score: TeamGameScore["score"];
  team1_side: MatchTeamSide;
  team2_side: MatchTeamSide;
}
