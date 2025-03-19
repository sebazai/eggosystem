export interface TeamMapScore {
  id: number;
  match_id: number;
  team_id: number;
  game_id: number;
  starting_side: "CT" | "T";
  score: number; // TINYINT UNSIGNED, stored as number
  halftime_score: number; // TINYINT UNSIGNED, stored as number
  overtime_score: number; // TINYINT UNSIGNED, stored as number, default 0
}
