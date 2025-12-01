/**
 * Team Balance Calculation Utilities (Frontend)
 *
 * This module provides calculation functions for frontend display
 * using constants from the shared @eggosystem/types package
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
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculates average from an array of kana_elo values
 * Matches backend calculateAverageFromValues function
 *
 * @param values - Array of kana_elo values (sorted highest to lowest)
 * @param topN - Number of top players to include (defaults to TOP_N_FOR_COMPARISON)
 * @returns Average of top N values, or "0" if insufficient data
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
 * @deprecated Use calculateAverageFromValues instead
 */
export const calculateAvg = calculateAverageFromValues;

/**
 * Gets the comparison average column name used by backend
 * Useful for accessing dynamic column names from API responses
 */
export const getComparisonAvgColumnName = (): string => {
  return `avg${TOP_N_FOR_COMPARISON}`;
};

/**
 * Gets the current top N column name used by backend
 */
export const getCurrentTopAvgColumnName = (n: number = 3): string => {
  return `current_top${n}_avg`;
};
