import type { League, Season } from "@eggosystem/types";

export interface Match {
  id: number;
  league_id: League["id"];
  season_id: Season["id"];
  stage: number; // TINYINT UNSIGNED, stored as number
  start_timestamp: string; // TIMESTAMP, represented as string (ISO format, UTC)
  end_timestamp: string | null; // TIMESTAMP, represented as string (ISO format, UTC)
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
