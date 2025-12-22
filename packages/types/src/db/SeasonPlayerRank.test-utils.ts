import type { SeasonPlayerRank } from "./SeasonPlayerRank.interface";

/**
 * Creates a mock SeasonPlayerRank object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial SeasonPlayerRank object to override defaults
 * @returns Complete SeasonPlayerRank object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const playerRank = createMockSeasonPlayerRank();
 *
 * // Override specific fields
 * const customPlayerRank = createMockSeasonPlayerRank({
 *   steam_id: "76561198012345678",
 *   season_id: 14,
 *   cs2_rank: 15000,
 *   faceit_level: 5
 * });
 * ```
 */
export const createMockSeasonPlayerRank = (
  overrides?: Partial<SeasonPlayerRank>
): SeasonPlayerRank => {
  const now = new Date().toISOString();
  return {
    id: 1,
    steam_id: "76561198012345678",
    season_id: 1,
    rank_updated_at: null,
    hours_updated_at: now,
    csgo_rank: null,
    cs2_rank: null,
    cs_hours: null,
    faceit_level: null,
    faceit_elo: 800,
    faceit_kd: null,
    faceit_date: null,
    kana_elo: 0,
    esportal_kd: null,
    esportal_elo: null,
    esportal_rank: null,
    ...overrides
  };
};
