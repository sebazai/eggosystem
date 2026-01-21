import type { League, Season } from "@eggosystem/types";

export interface Match {
  id: number;
  league_id: League["id"];
  season_id: Season["id"];
  stage: number; // TINYINT UNSIGNED, stored as number
  /**
   * Match start timestamp in UTC, ISO 8601 format with 'Z' indicator (e.g., '2025-01-15T10:30:00.000Z')
   * Stored as TIMESTAMP in database (UTC). Returned as Date object from models, serialized to ISO string by Express res.json()
   */
  start_timestamp: string;
  /**
   * Match end timestamp in UTC, ISO 8601 format with 'Z' indicator (e.g., '2025-01-15T10:30:00.000Z')
   * Stored as TIMESTAMP in database (UTC). Returned as Date object from models, serialized to ISO string by Express res.json()
   */
  end_timestamp: string | null;
  best_of: number; // TINYINT UNSIGNED, stored as number
  external_match_room_id: string | null;
  status: keyof typeof MatchStatus;
  round: number; // Round in Faceit bracket // TODO: Special case, group 3, round 2, should be a setting in SeasonLeague, i.e. if we play the grand final so that we only care about round 1.
  group: number; // 3 = Grand final, 2 = Lowerbracket, 1 = Upperbracket
}

export const MatchStatus = {
  SCHEDULED: "SCHEDULED",
  CHECK_IN: "CHECK_IN",
  VOTING: "VOTING", // TODO: When exactly? :)
  CONFIGURING: "CONFIGURING", // These actually come 3 times if match is best_of 3, so more of MatchGame statuses
  READY: "READY", // These actually come 3 times if match is best_of 3, so more of MatchGame statuses
  ONGOING: "ONGOING",
  FINISHED: "FINISHED",
  ABORTED: "ABORTED",
  CANCELLED: "CANCELLED",
  FORFEIT: "FORFEIT"
};
