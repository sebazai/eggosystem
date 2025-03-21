import type { Match, MatchGame, Team } from "@eggosystem/types";

export interface TeamGameScore {
  id: number;
  match_id: Match["id"];
  team_id: Team["id"];
  game_id: MatchGame["id"];
  starting_side: "CT" | "T";
  score: number; // TINYINT UNSIGNED, stored as number
  halftime_score: number; // TINYINT UNSIGNED, stored as number
  overtime_score: number; // TINYINT UNSIGNED, stored as number, default 0
}
