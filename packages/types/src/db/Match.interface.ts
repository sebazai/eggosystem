import type { League, Season } from "@eggosystem/types";

export interface Match {
  id: number;
  league_id: League["id"];
  season_id: Season["id"];
  stage: number; // TINYINT UNSIGNED, stored as number
  match_date: string; // DATE, represented as string (ISO format)
  start_time: string; // TIME, represented as string (ISO format)
  end_time: string; // TIME, represented as string (ISO format)
  best_of: number; // TINYINT UNSIGNED, stored as number
  external_match_room_id: string | null;
}
