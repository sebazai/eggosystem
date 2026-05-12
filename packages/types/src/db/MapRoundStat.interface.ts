import type {
  MatchGame,
  Nullable,
  RoundEndReasonInfo,
  Team
} from "@eggosystem/types";

export interface MapRoundStat {
  id: number;
  match_game_id: MatchGame["id"];
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
  // Buy types and pre-buy bank (from add_round_info migration)
  ct_buy_type?: string | null;
  t_buy_type?: string | null;
  ct_pre_buy_bank?: number | null;
  t_pre_buy_bank?: number | null;
  ct_equipment_value?: number | null;
  t_equipment_value?: number | null;
  importance?: number | null;
  // NewRoundInfo fields (from add_new_round_info_columns migration)
  winner?: Nullable<"CT" | "T">;
  round_type?: string | null;
  ct_avg_bank?: number | null;
  t_avg_bank?: number | null;
  ct_total_bank?: number | null;
  t_total_bank?: number | null;
  ct_pre_buy_eq_value?: number | null;
  t_pre_buy_eq_value?: number | null;
  ct_end_bank?: number | null;
  t_end_bank?: number | null;
  ct_end_eq_value?: number | null;
  t_end_eq_value?: number | null;
  ct_buy_strategy?: string | null;
  t_buy_strategy?: string | null;
}
