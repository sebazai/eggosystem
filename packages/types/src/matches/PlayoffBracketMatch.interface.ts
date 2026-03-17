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
  /**
   * Bracket metadata and optional precomputed layout.
   * `layout` is the canonical source of rendering order when present.
   */
  bracket: {
    /** Power-of-two bracket size (e.g. 8/16/32). 0 when unknown. */
    bracketSize?: number;
    numR1Slots: number;
    /**
     * Seed-indexed team lookup (1-based). Index 0 is unused.
     * When a seed is a BYE or not assigned, the entry is null.
     */
    seeds?: Array<{
      seed: number;
      team_id: number;
      team_name: string;
      team_logo: string | null;
    } | null>;
    /**
     * Precomputed layout for rendering.
     * group: 1=upper, 2=lower, 3=grand final (mirrors FaceIT groups).
     *
     * Each slot entry contains a match identifier to dereference from `matches`,
     * or null for an empty slot placeholder.
     */
    layout?: {
      groups: Array<{
        group: number;
        rounds: Array<{
          round: number;
          slots: Array<{
            match_id: number;
            external_match_id?: string;
          } | null>;
        }>;
      }>;
    };
  };
}
