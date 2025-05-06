import { PlayerStats, Team, TeamGameScore } from "@eggosystem/types";

export interface GameTeamStats {
  team_id: TeamGameScore["team_id"];
  name: Team["name"];
  first_kills: PlayerStats["first_kills"];
  clutches_won: PlayerStats["clutches_won"];
  plants: PlayerStats["plants"];
  trades: PlayerStats["trades"];
}
