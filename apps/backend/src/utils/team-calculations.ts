/**
 * Team Balance Calculation Utilities (Backend)
 *
 * This module provides SQL query builders and calculation functions
 * that use the centralized constants from @eggosystem/types
 */

// Import constants from shared types package
import {
  TOP_N_FOR_CURRENT_AVG,
  TOTAL_PLAYERS_IN_NEW_AVG,
  TOP_N_FOR_COMPARISON,
  TOP_N_FOR_DISPLAY
} from "@eggosystem/types";

// Re-export constants for backward compatibility
export {
  TOP_N_FOR_CURRENT_AVG,
  TOTAL_PLAYERS_IN_NEW_AVG,
  TOP_N_FOR_COMPARISON,
  TOP_N_FOR_DISPLAY
};

// ============================================================================
// SQL QUERY BUILDERS
// ============================================================================

/**
 * Generates SQL CASE statement for calculating current team average
 * Used in eligibility checks
 *
 * @returns SQL fragment: "ROUND(AVG(CASE WHEN player_rank <= N ...))"
 */
export const buildCurrentAvgSQL = (): string => {
  return `ROUND(AVG(CASE WHEN player_rank <= ${TOP_N_FOR_CURRENT_AVG} THEN kana_elo ELSE NULL END), 3)`;
};

/**
 * Generates SQL CASE statement for calculating comparison average
 * Used in team rankings and eligibility comparisons
 *
 * @returns SQL fragment: "ROUND(AVG(CASE WHEN player_rank <= N ...))"
 */
export const buildComparisonAvgSQL = (
  columnName: string = "kana_elo"
): string => {
  return `ROUND(AVG(CASE WHEN player_rank <= ${TOP_N_FOR_COMPARISON} THEN ${columnName} ELSE NULL END), 3)`;
};

/**
 * Generates SQL WHERE clause for filtering top N players for display
 * Used in sortter queries
 *
 * @returns SQL fragment: "player_rank <= N"
 */
export const buildTopPlayersFilter = (): string => {
  return `player_rank <= ${TOP_N_FOR_DISPLAY}`;
};

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculates the new team average when adding a player
 *
 * Formula: (currentTopAvg * TOP_N_FOR_CURRENT_AVG + newPlayerElo) / TOTAL_PLAYERS_IN_NEW_AVG
 *
 * @param currentTopAvg - Average of the team's current top N players
 * @param newPlayerElo - The new player's kana_elo
 * @returns New average rounded to 3 decimal places
 *
 * @example
 * // Team has top 3 avg of 1700, adding player with 1800
 * calculateNewTeamAverage(1700, 1800)
 * // Returns: 1725 (calculated as (1700 * 3 + 1800) / 4)
 */
export const calculateNewTeamAverage = (
  currentTopAvg: number,
  newPlayerElo: number
): number => {
  return (
    Math.round(
      ((currentTopAvg * TOP_N_FOR_CURRENT_AVG + newPlayerElo) /
        TOTAL_PLAYERS_IN_NEW_AVG) *
        1000
    ) / 1000
  );
};

/**
 * Calculates average from an array of kana_elo values
 * Used in frontend for display purposes
 *
 * @param values - Array of kana_elo values (sorted highest to lowest)
 * @param topN - Number of top players to include (defaults to TOP_N_FOR_COMPARISON)
 * @returns Average of top N values, or 0 if insufficient data
 *
 * @example
 * calculateAverageFromValues([1800, 1700, 1600, 1500, 1400])
 * // Returns: "1650.000" (avg of top 4: (1800+1700+1600+1500)/4)
 */
export const calculateAverageFromValues = (
  values: number[],
  topN: number = TOP_N_FOR_COMPARISON
): string => {
  if (!values || values.length < topN) {
    // If not enough players, use what we have
    const availableCount = values?.length || 0;
    if (availableCount === 0) return "0";

    const sum = values.reduce((acc, val) => acc + val, 0);
    return (sum / availableCount).toFixed(3);
  }

  const topValues = values.slice(0, topN);
  const sum = topValues.reduce((acc, val) => acc + val, 0);
  return (sum / topN).toFixed(3);
};

/**
 * Determines if a team can add a player based on balance rules
 *
 * Rule: New team average must be <= top team's comparison average
 *
 * @param newTeamAverage - The team's average after adding the player
 * @param topTeamAverage - The top team in the league's comparison average
 * @returns true if player can be added, false otherwise
 */
export const canAddPlayerToTeam = (
  newTeamAverage: number,
  topTeamAverage: number
): boolean => {
  return newTeamAverage <= topTeamAverage;
};

// ============================================================================
// TYPE DEFINITIONS FOR SQL COLUMN NAMES
// ============================================================================

/**
 * Column names used in SQL queries
 * Keeps naming consistent across all calculations
 */
export const SQL_COLUMNS = {
  CURRENT_TOP_AVG: `current_top${TOP_N_FOR_CURRENT_AVG}_avg`,
  CURRENT_COMPARISON_AVG: `current_top${TOP_N_FOR_COMPARISON}_avg`,
  COMPARISON_AVG: `avg${TOP_N_FOR_COMPARISON}`,
  ORIGINAL_COMPARISON_AVG: `orig${TOP_N_FOR_COMPARISON}`
} as const;

// Note: Validation is handled in the @eggosystem/types package
// Import and use validateTeamBalanceConfig() if you need to revalidate
