/**
 * Kana leaderboard tier values accepted by the GET /v1/kana-leaderboard
 * `?tier` query parameter.
 *
 * - Broad groupings (`EGG` | `CHICK` | `CHICKEN` | `COCK`) match any sub-rank
 *   of that rank.
 * - Sub-ranks (`*_1` | `*_2` | `*_3`) match an exact rank + subrank.
 * - `TOP_COCK` matches the top-10 global positions.
 */
export const KANA_TIERS = [
  "TOP_COCK",
  "COCK",
  "COCK_1",
  "COCK_2",
  "COCK_3",
  "CHICKEN",
  "CHICKEN_1",
  "CHICKEN_2",
  "CHICKEN_3",
  "CHICK",
  "CHICK_1",
  "CHICK_2",
  "CHICK_3",
  "EGG",
  "EGG_1",
  "EGG_2",
  "EGG_3"
] as const;

export type KanaTier = (typeof KANA_TIERS)[number];

/**
 * Broad kana rank groupings assigned to a leaderboard entry. `TOP_COCK` is the
 * top-10 global positions; the rest are derived from kana elo thresholds.
 */
export type KanaRank = "TOP_COCK" | "COCK" | "CHICKEN" | "CHICK" | "EGG";

/**
 * A single entry in the kana elo leaderboard.
 *
 * `position` is the player's 1-based rank within the global top 50 (highest
 * kana elo first) and is unchanged by any `?tier` filter.
 */
export interface KanaLeaderboardEntry {
  /** 1-based global top-50 position; never changed by a tier filter. */
  position: number;
  steam_id: string;
  nickname: string;
  kana_elo: number;
  /** Kana rank, e.g. `TOP_COCK`, `COCK`, `CHICKEN`, `CHICK`, `EGG`. */
  rank: KanaRank;
  /** Sub-rank within the rank (1-3); `1` for `TOP_COCK`. */
  subrank: number;
  /** Steam community profile URL for the player. */
  profile_url: string;
}

/**
 * Response body for GET /v1/kana-leaderboard.
 *
 * `tier` echoes the applied filter (`null` when omitted). `players` is the
 * global top-50 list, optionally filtered to a single tier, ordered highest
 * kana elo first.
 */
export interface KanaLeaderboardResponse {
  tier: KanaTier | null;
  players: KanaLeaderboardEntry[];
}
