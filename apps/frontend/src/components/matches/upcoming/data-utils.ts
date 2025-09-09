/**
 * Utility functions for handling team data with fallback logic
 */

/**
 * Determines which data to use based on fallback logic.
 *
 * Logic:
 * 1. If both teams have filtered data → use filtered data for both
 * 2. If both teams have fallback data AND at least one doesn't have filtered data → use fallback data for both
 * 3. Otherwise → use the best available data for each team individually
 *
 * This ensures fair comparisons while maximizing data quality.
 */
export const getTeamDataWithFallback = <T>(
  team1Filtered: T[] | null | undefined,
  team1Fallback: T[] | null | undefined,
  team2Filtered: T[] | null | undefined,
  team2Fallback: T[] | null | undefined
) => {
  const team1HasFiltered = team1Filtered && team1Filtered.length > 0;
  const team2HasFiltered = team2Filtered && team2Filtered.length > 0;
  const team1HasFallback = team1Fallback && team1Fallback.length > 0;
  const team2HasFallback = team2Fallback && team2Fallback.length > 0;

  // Case 1: Both teams have filtered data → use filtered data for both
  if (team1HasFiltered && team2HasFiltered) {
    return {
      team1Data: team1Filtered,
      team2Data: team2Filtered
    };
  }

  // Case 2: Both teams have fallback data AND at least one doesn't have filtered data → use fallback data for both
  if (
    team1HasFallback &&
    team2HasFallback &&
    (!team1HasFiltered || !team2HasFiltered)
  ) {
    return {
      team1Data: team1Fallback,
      team2Data: team2Fallback
    };
  }

  // Case 3: Otherwise → use the best available data for each team individually
  return {
    team1Data: team1HasFiltered ? team1Filtered : team1Fallback,
    team2Data: team2HasFiltered ? team2Filtered : team2Fallback
  };
};
