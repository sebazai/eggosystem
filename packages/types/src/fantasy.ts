/**
 * Shared Fantasy League Types
 * Used across backend value calculation and frontend display
 */

/**
 * Player tier based on current market value
 * Tier assignment:
 * - Gold: €210K+ (top tier, elite players)
 * - Silver: €180K-€210K (mid tier, solid players)
 * - Bronze: €160K-€180K (budget tier, entry-level players)
 */
export type PlayerTier = "bronze" | "silver" | "gold";

/**
 * Value boundaries for tier calculation
 */
export const TIER_BOUNDARIES = {
  GOLD_MIN: 210000,
  SILVER_MIN: 180000,
  BRONZE_MIN: 160000,
  VALUE_MIN: 160000,
  VALUE_MAX: 240000
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
 * @param rating - Kana rating (typically 0.40 - 1.10)
 * @param kd - Kill/Death ratio
 * @param kills - Total kills
 * @returns Player value in euros (e.g., 195000 = 195K €)
 */
export function calculateInitialPlayerValue(
  rating: number,
  kd: number,
  kills: number
): number {
  const MIN_RATING = 0.4;
  const MAX_RATING = 1.1;

  const normalizedRating = Math.min(
    1,
    Math.max(0, (rating - MIN_RATING) / (MAX_RATING - MIN_RATING))
  );

  // Sigmoid with factor 4 (gentler curve for better spread)
  const curved = 1 / (1 + Math.exp(-4 * (normalizedRating - 0.5)));

  // Map to wider base range: 155K to 225K (70K spread)
  let baseValue = 155000 + curved * 70000;

  // K/D bonus ±8%
  const kdBonus = Math.min(Math.max((kd - 1.0) * 0.08, -0.04), 0.08);
  baseValue = baseValue * (1 + kdBonus);

  // Kills bonus up to 5%
  const killBonus = Math.min(kills / 4000, 0.05);
  baseValue = baseValue * (1 + killBonus);

  // Final bounds: 160K to 240K
  return Math.floor(
    Math.max(
      TIER_BOUNDARIES.VALUE_MIN,
      Math.min(TIER_BOUNDARIES.VALUE_MAX, baseValue)
    )
  );
}

/**
 * Calculate value change after a match based on fantasy points earned
 * This applies a percentage change to the current value, capped at ±10%
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
  const MAX_CHANGE_PERCENT = 5; // Reduced from 10% to 5% per match for stability
  const MAX_POINTS = 30;

  // Map individual points (-30 to +30) to change percentage (-5% to +5%)
  // Linear scaling: points / 30 * 5
  const rawChangePercent = (individualPoints / MAX_POINTS) * MAX_CHANGE_PERCENT;

  // Clamp to ±5%
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
  team_id: number;
  team_name: string;
  team_logo: string | null;
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
