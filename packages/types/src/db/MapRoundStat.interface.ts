import type {
  MatchGame,
  Nullable,
  RoundEndReasonInfo,
  Team
} from "@eggosystem/types";

export interface MapRoundStat {
  id: number;
  game_id: MatchGame["id"];
  ct_team_id: Team["id"];
  t_team_id: Team["id"];
  round_number: number; // TINYINT UNSIGNED stored as number
  round_end_reason_info: RoundEndReasonInfo; // TINYINT UNSIGNED stored as number
  ct_t?: {
    T: number[]; // Array of player steam IDs on the T side
    CT: number[]; // Array of player steam IDs on the CT side
  } | null; // optional, can be null
  first_kill: Nullable<"CT" | "T">; // 'CT' or 'T', can be null
  plant_site?: "A" | "B" | null; // CHAR(1), optional, can be null
}
