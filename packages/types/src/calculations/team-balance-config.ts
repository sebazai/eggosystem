/**
 * Team Balance Calculation Configuration Constants
 *
 * These constants define how team averages are calculated across:
 * - Player eligibility checks
 * - Sortter team rankings
 * - Team balance comparisons
 *
 * ⚠️ CRITICAL: These values affect competitive balance rules
 * Any changes should be discussed with league administrators
 *
 * To change the calculation method (e.g., from avg of 4 to avg of 5):
 * 1. Update the constants below
 * 2. Rebuild types package: cd packages/types && pnpm build
 * 3. All calculations in frontend and backend will automatically use new values
 */

// ============================================================================
// CONFIGURATION CONSTANTS - Change these to modify all calculations
// ============================================================================

/**
 * Number of top players to use when calculating current team average
 * (before adding a new player)
 *
 * Current: 3 (uses top 3 players)
 * Example: If team has players [1800, 1700, 1600, 1500, 1400]
 *          → uses [1800, 1700, 1600] for current average
 */
export const TOP_N_FOR_CURRENT_AVG = 3;

/**
 * Total number of players to use when calculating the new average
 * (after adding a new player)
 *
 * Current: 4 (uses top 3 + new player = 4 total)
 * Formula: (top3_avg * 3 + new_player) / 4
 */
export const TOTAL_PLAYERS_IN_NEW_AVG = 4;

/**
 * Number of top players to use for team comparison and league rankings
 *
 * Current: 4 (compares based on avg of top 4 players)
 * Used for: Sortter rankings, eligibility comparisons
 */
export const TOP_N_FOR_COMPARISON = 4;

/**
 * Number of top players to display in detailed views
 *
 * Current: 5 (shows top 5 players in sortter)
 */
export const TOP_N_FOR_DISPLAY = 5;

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validates that constants are configured correctly
 * Throws error if configuration is invalid
 */
export const validateTeamBalanceConfig = (): void => {
  if (TOP_N_FOR_CURRENT_AVG >= TOTAL_PLAYERS_IN_NEW_AVG) {
    throw new Error(
      `Invalid team balance config: TOP_N_FOR_CURRENT_AVG (${TOP_N_FOR_CURRENT_AVG}) ` +
        `must be less than TOTAL_PLAYERS_IN_NEW_AVG (${TOTAL_PLAYERS_IN_NEW_AVG})`
    );
  }

  if (TOP_N_FOR_CURRENT_AVG < 1 || TOTAL_PLAYERS_IN_NEW_AVG < 2) {
    throw new Error(
      `Invalid team balance config: Values must be positive integers`
    );
  }

  if (TOP_N_FOR_COMPARISON < 1 || TOP_N_FOR_DISPLAY < 1) {
    throw new Error(
      `Invalid team balance config: Comparison and display values must be positive integers`
    );
  }
};

// Run validation on module load
validateTeamBalanceConfig();
