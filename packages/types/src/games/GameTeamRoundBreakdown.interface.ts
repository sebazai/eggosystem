import { Team } from "../db";

export interface GameTeamRoundBreakdown {
  team_id: Team["id"];
  starting_side: "CT" | "T";
  rounds_won_first_half: number;
  rounds_won_second_half: number;
  total_rounds_won: number;
  total_overtime_rounds_won: number;
  overtime_rounds_won_ct: number;
  overtime_rounds_wont_t: number;
}
