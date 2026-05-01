import { Team } from "@eggosystem/types";
import type { MatchTeamSide } from "./MatchTeamSide.types";

export interface MatchTeamInfo {
  id: Team["id"];
  name: Team["name"];
  logo: Team["team_logo"];
  score: number;
  rank: number | null;
  side: MatchTeamSide;
  accentColor?: string;
}
