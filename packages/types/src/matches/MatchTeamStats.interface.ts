import { PlayerStats, Team, TeamGameScore } from "@eggosystem/types";

export interface MatchTeamStats {
  team_id: TeamGameScore["team_id"];
  name: Team["name"];
  score?: TeamGameScore["score"];
  team_ht_score?: TeamGameScore["halftime_score"];
  starting_side: "T" | "CT";
  first_kills: PlayerStats["first_kills"];
  clutches_won: PlayerStats["clutches_won"];
  plants: PlayerStats["plants"];
  trades: PlayerStats["trades"];
}
