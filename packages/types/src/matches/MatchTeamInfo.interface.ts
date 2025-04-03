import { Team } from "@eggosystem/types";

export interface MatchTeamInfo {
  id: Team["id"];
  name: Team["name"];
  logo: Team["team_logo"];
  score: number;
  rank: number;
}
