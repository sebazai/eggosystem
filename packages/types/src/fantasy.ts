/**
 * Shared Fantasy League Types
 * Used across backend value calculation and frontend display
 */

/**
 * Player tier based on current market value
 * Tier assignment (adjusted for €150K-€250K range):
 * - Gold: €215K+ (top tier, elite players ~15%)
 * - Silver: €175K-€215K (mid tier, most players ~60%)
 * - Bronze: €150K-€175K (budget tier, entry-level players ~25%)
 */
export type PlayerTier = "bronze" | "silver" | "gold";

/**
 * Value boundaries for tier calculation
 * Adjusted for wider range and Silver as most common tier
 */
export const TIER_BOUNDARIES = {
  GOLD_MIN: 215000,
  SILVER_MIN: 175000,
  BRONZE_MIN: 150000,
  VALUE_MIN: 150000,
  VALUE_MAX: 250000
} as const;

/**
 * Calculate player tier from their current market value
 * @param value - Player's current value in euros (e.g., 195000 = 195K €)
 * @returns Tier classification
 */
export function calculatePlayerTier(value: number): PlayerTier {
  if (value >= TIER_BOUNDARIES.GOLD_MIN) return "gold";
  if (value >= TIER_BOUNDARIES.SILVER_MIN) return "silver";
  return "bronze";
}

/**
 * Calculate initial player value from season stats
 * This is used for initial seeding at season start
 * Distribution aims for: ~15% Gold, ~60% Silver, ~25% Bronze
 * @param rating - Kana rating (typically 0.40 - 1.10)
 * @param kd - Kill/Death ratio
 * @param kills - Total kills
 * @param kanaElo - Optional Kana ELO (typically 50-350) - if provided, weights the calculation
 * @returns Player value in euros (e.g., 195000 = 195K €)
 */
export function calculateInitialPlayerValue(
  rating: number,
  kd: number,
  kills: number
): number {
  const MIN_RATING = 0.4;
  const MAX_RATING = 1.1;

  // Normalize rating (0 to 1)
  const normalizedRating = (rating - MIN_RATING) / (MAX_RATING - MIN_RATING);

  // Use gentler curve for better spread (sigmoid factor 4 instead of 6)
  const curved = 1 / (1 + Math.exp(-4 * (normalizedRating - 0.5)));

  // Map to wider base range: 155K to 225K (70K spread)
  const BASE = 155000;
  const SPREAD = 70000;
  let baseValue = BASE + curved * SPREAD;

  // Increase K/D impact (up to ±8% instead of ±4%)
  const kdBonus = Math.min(Math.max((kd - 1.0) * 0.08, -0.04), 0.08);
  baseValue = baseValue * (1 + kdBonus);

  // Increase kills impact (up to 5% instead of 2.5%)
  const killBonus = Math.min(kills / 4000, 0.05);
  baseValue = baseValue * (1 + killBonus);

  // Final bounds: 160K to 240K
  return Math.floor(Math.max(160000, Math.min(240000, baseValue)));
}

/**
 * Calculate value change after a match based on fantasy points earned
 * This applies a percentage change to the current value, capped at ±3%
 *
 * @param currentValue - Player's current market value
 * @param individualPoints - Individual fantasy points earned (-30 to +30)
 * @returns Object with new value, change in basis points (1% = 100), and absolute change amount
 */
export function calculateValueChangeFromMatch(
  currentValue: number,
  individualPoints: number
): {
  newValue: number;
  changeBasisPoints: number; // Integer: 100 = 1%, 1000 = 10%, -500 = -5%
  valueChange: number;
} {
  const MAX_CHANGE_PERCENT = 3; // Reduced from 5% to 3% per match for smoother progression
  const MAX_POINTS = 30;

  // Map individual points (-30 to +30) to change percentage (-3% to +3%)
  // Linear scaling: points / 30 * 3
  const rawChangePercent = (individualPoints / MAX_POINTS) * MAX_CHANGE_PERCENT;

  // Clamp to ±3%
  const changePercent = Math.max(
    -MAX_CHANGE_PERCENT,
    Math.min(MAX_CHANGE_PERCENT, rawChangePercent)
  );

  // Convert to basis points (multiply by 100 to avoid floating point)
  // 3.5% becomes 350, -2.1% becomes -210
  const changeBasisPoints = Math.round(changePercent * 100);

  // Calculate actual value change
  const valueChange = Math.floor(currentValue * (changeBasisPoints / 10000));

  // Apply value change and clamp to min/max bounds
  let newValue = currentValue + valueChange;
  newValue = Math.floor(
    Math.max(
      TIER_BOUNDARIES.VALUE_MIN,
      Math.min(TIER_BOUNDARIES.VALUE_MAX, newValue)
    )
  );

  return {
    newValue,
    changeBasisPoints,
    valueChange
  };
}

/**
 * Player value data with tier
 */
export interface PlayerValueData {
  value: number;
  tier: PlayerTier;
}

/**
 * Fantasy player statistics for drafting
 * Used across backend and frontend
 */
export interface FantasyPlayerStats {
  steam_id: string;
  nickname: string;
  avatar: string | null;
  team_id: number;
  team_name: string;
  team_logo: string | null;
  value: number;
  tier: PlayerTier;
  kana_rating: number;
  kd: number;
  kills: number;
  deaths: number;
  adr: number | null;
  adr_t: number | null;
  adr_ct: number | null;
  headshots: number;
  headshot_percentage: number;
  flash_assists: number;
  first_kills: number;
  first_deaths: number;
  kast: number | null;
  maps_played: number;
}
