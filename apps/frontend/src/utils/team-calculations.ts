/**
 * Team Balance Calculation Utilities (Frontend)
 * Provides calculation functions for frontend display using constants from @eggosystem/types
 */

import {
  TOP_N_FOR_CURRENT_AVG,
  TOTAL_PLAYERS_IN_NEW_AVG,
  TOP_N_FOR_COMPARISON,
  TOP_N_FOR_DISPLAY,
  calculateAverageFromValues
} from "@eggosystem/types";

export {
  TOP_N_FOR_CURRENT_AVG,
  TOTAL_PLAYERS_IN_NEW_AVG,
  TOP_N_FOR_COMPARISON,
  TOP_N_FOR_DISPLAY,
  calculateAverageFromValues
};

/** @deprecated Use calculateAverageFromValues instead */
export const calculateAvg = calculateAverageFromValues;

export const getComparisonAvgColumnName = (): string => {
  return `avg${TOP_N_FOR_COMPARISON}`;
};

export const getCurrentTopAvgColumnName = (n: number = 3): string => {
  return `current_top${n}_avg`;
};
