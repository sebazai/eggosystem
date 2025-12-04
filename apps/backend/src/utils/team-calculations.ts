/**
 * Team Balance Calculation Utilities (Backend)
 * Provides SQL query builders and calculation functions using constants from @eggosystem/types
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

export const buildCurrentAvgSQL = (): string => {
  return `ROUND(AVG(CASE WHEN player_rank <= ${TOP_N_FOR_CURRENT_AVG} THEN kana_elo ELSE NULL END), 3)`;
};

export const buildComparisonAvgSQL = (
  columnName: string = "kana_elo"
): string => {
  return `ROUND(AVG(CASE WHEN player_rank <= ${TOP_N_FOR_COMPARISON} THEN ${columnName} ELSE NULL END), 3)`;
};

export const buildTopPlayersFilter = (): string => {
  return `player_rank <= ${TOP_N_FOR_DISPLAY}`;
};

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

export const canAddPlayerToTeam = (
  newTeamAverage: number,
  topTeamAverage: number
): boolean => {
  return newTeamAverage <= topTeamAverage;
};

export const SQL_COLUMNS = {
  CURRENT_TOP_AVG: `current_top${TOP_N_FOR_CURRENT_AVG}_avg`,
  CURRENT_COMPARISON_AVG: `current_top${TOP_N_FOR_COMPARISON}_avg`,
  COMPARISON_AVG: `avg${TOP_N_FOR_COMPARISON}`,
  ORIGINAL_COMPARISON_AVG: `orig${TOP_N_FOR_COMPARISON}`
} as const;
