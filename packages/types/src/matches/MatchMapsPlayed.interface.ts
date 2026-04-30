import { Map, MatchGame, TeamGameScore } from "@eggosystem/types";
import type { MatchTeamSide } from "./MatchTeamSide.types";

export interface MatchMapsPlayed {
  id: MatchGame["id"];
  match_id: MatchGame["match_id"];
  map_order: MatchGame["map_order"];
  map_name: Map["name"];
  demofile: MatchGame["demofile"];
  team1_score: TeamGameScore["score"];
  team2_score: TeamGameScore["score"];
  team1_side: MatchTeamSide;
  team2_side: MatchTeamSide;
}
