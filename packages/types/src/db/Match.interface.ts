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
  status: MatchStatus;
  round: number; // Round in Faceit bracket // TODO: Special case, group 3, round 2, should be a setting in SeasonLeague, i.e. if we play the grand final so that we only care about round 1.
  group: number; // 3 = Grand final, 2 = Lowerbracket, 1 = Upperbracket
}

export enum MatchStatus {
  SCHEDULED = "SCHEDULED",
  CHECK_IN = "CHECK_IN",
  VOTING = "VOTING", // TODO: When exactly? :)
  CONFIGURING = "CONFIGURING", // These actually come 3 times if match is best_of 3, so more of MatchGame statuses
  READY = "READY", // These actually come 3 times if match is best_of 3, so more of MatchGame statuses
  ONGOING = "ONGOING",
  FINISHED = "FINISHED",
  ABORTED = "ABORTED",
  CANCELLED = "CANCELLED",
  FORFEIT = "FORFEIT"
}
