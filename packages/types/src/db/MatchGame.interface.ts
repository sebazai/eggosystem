import type { Map, Match } from "@eggosystem/types";

export interface MatchGame {
  id: number;
  match_id: Match["id"];
  map_id: Map["id"]; // TINYINT UNSIGNED stored as number
  demofile: string; // demo file
  map_order?: number | null; // TINYINT UNSIGNED, optional
  regulation_rounds: number;
  /** When true, demo parse must not overwrite TeamGameScores (staff set). */
  team_game_scores_staff_lock: boolean;
}
