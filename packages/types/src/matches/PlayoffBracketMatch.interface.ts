import type { Match } from "../db";

export interface PlayoffBracketMatch {
  /** Internal match id (0 when not in our DB). Use external_match_id for stable list keys when present. */
  match_id: number;
  /** FaceIT match id when from FaceIT API; unique and stable for bracket list keys. */
  external_match_id?: string;
  round: number;
  group: number;
  status: Match["status"];
  best_of: number;
  start_timestamp: string;
  team1_id: number;
  team1_name: string;
  team1_logo: string | null;
  /** Null when the match is a bye (one team advances without playing) */
  team2_id: number | null;
  team2_name: string | null;
  team2_logo: string | null;
  team1_score: number;
  /** 0 when team2 is null (bye) */
  team2_score: number;
  /** 0-based position within the round for bracket display order (from playoff_seed in round 1). */
  slot?: number;
  /** 1-based playoff seed for team1 when known (from season league team). */
  seed1?: number;
  /** 1-based playoff seed for team2 when known; undefined for BYE. */
  seed2?: number;
}

/** API response for GET playoff bracket: matches plus bracket shape from seeds/FaceIT. */
export interface PlayoffBracketResponse {
  matches: PlayoffBracketMatch[];
  /** Round-1 slot count (from seeds); used to build dynamic tree and placeholders. */
  bracket: {
    numR1Slots: number;
  };
}
