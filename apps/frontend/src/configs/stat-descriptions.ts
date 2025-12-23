/**
 * Stat descriptions used throughout the application for tooltips
 * These provide context to help users understand what each stat means
 */

export const STAT_DESCRIPTIONS = {
  // Core Stats
  kills: "Total kills in the match or time period.",
  deaths: "Total deaths in the match or time period.",
  assists: "Total assists in the match or time period.",
  kd_ratio:
    "Kill/Death ratio. Higher than 1.0 means more kills than deaths. 1.2+ is considered good.",
  adr: "Average Damage per Round. Measures consistent damage output. 80+ is good, 100+ is excellent.",
  hs_percent:
    "Percentage of kills that were headshots. Higher indicates better aim precision. 40%+ is good.",
  kana_rating:
    "Kanaliiga's composite rating based on impact, consistency, and clutch ability. 1.0 is average.",
  kast: "Percentage of rounds with a Kill, Assist, Survived, or Traded. 70%+ is considered good.",

  // Trading Stats
  trade_opportunities:
    "Number of situations where a teammate died and the player could have traded.",
  trade_attempts:
    "Number of times the player attempted to secure a trade kill.",
  trades: "Number of successful trade kills secured.",
  trade_success:
    "Percentage of trade attempts that resulted in a kill. Shows reaction speed and positioning.",
  deaths_untraded:
    "Deaths where the team failed to trade within 5 seconds. Lower is better.",

  // Utility Stats
  utility_damage:
    "Total damage dealt with grenades (HE, molotov) across the period.",
  flash_assists:
    "Kills secured by teammates while the enemy was flashed by this player.",
  avg_enemy_flash_duration:
    "Average time in seconds that enemies are blinded by this player's flashes. 1.5s+ is good.",
  avg_teammate_flash_duration:
    "Average time in seconds that teammates are blinded by this player's flashes. Lower is better.",
  damage_per_nade: "Average damage dealt per HE grenade thrown.",

  // Positioning/Movement Stats
  crosshair_placement:
    "Average angle deviation from head level when engaging enemies. Lower is better (0° = perfect). Under 6° is good.",
  counter_strafing:
    "Percentage of shots fired while properly counter-strafed for maximum accuracy. 80%+ is excellent.",
  time_to_damage:
    "Average time in milliseconds to deal first damage after spotting an enemy. Lower is better. Under 500ms is good.",

  // Opening Duel Stats
  first_kills:
    "Number of opening kills (first kill of the round). Important for entry fraggers.",
  first_deaths:
    "Number of opening deaths (first death of the round). High values may indicate aggressive positioning.",
  opening_duel_win_rate:
    "First kills / (First kills + First deaths). Shows entry/anchor effectiveness. 50%+ is good.",
  first_kills_t: "Opening kills while playing T-side.",
  first_deaths_t: "Opening deaths while playing T-side.",
  first_kills_ct:
    "Opening kills while playing CT-side (usually holding angles).",
  first_deaths_ct:
    "Opening deaths while playing CT-side (may indicate getting picked).",

  // Win Stats
  win_percentage:
    "Percentage of maps won. 50%+ indicates positive performance.",
  maps_played: "Total number of maps played in the selected time period.",

  // Side Stats
  kills_t: "Total kills while playing T-side.",
  kills_ct: "Total kills while playing CT-side.",
  kd_t: "Kill/Death ratio while playing T-side.",
  kd_ct: "Kill/Death ratio while playing CT-side."
} as const;

export type StatKey = keyof typeof STAT_DESCRIPTIONS;

/**
 * Get a stat description by key, with fallback to empty string
 */
export function getStatDescription(key: string): string {
  return STAT_DESCRIPTIONS[key as StatKey] || "";
}
