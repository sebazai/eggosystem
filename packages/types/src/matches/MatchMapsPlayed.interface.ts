import { Map, MatchGame, TeamGameScore } from "@eggosystem/types";

export interface MatchMapsPlayed {
  id: MatchGame["id"];
  map_name: Map["name"];
  demofile: MatchGame["demofile"];
  team1_score: TeamGameScore["score"];
  team2_score: TeamGameScore["score"];
}
