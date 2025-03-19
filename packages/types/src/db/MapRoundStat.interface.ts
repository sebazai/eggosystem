export interface MapRoundStat {
  id: number;
  game_id: number;
  ct_team_id: number;
  t_team_id: number;
  round_number: number; // TINYINT UNSIGNED stored as number
  round_end_reason_info: number; // TINYINT UNSIGNED stored as number
  ct_t?: {
    T: number[]; // Array of player steam IDs on the T side
    CT: number[]; // Array of player steam IDs on the CT side
  } | null; // optional, can be null
  first_kill: "CT" | "T"; // 'CT' or 'T'
  plant_site?: "A" | "B" | null; // CHAR(1), optional, can be null
}
