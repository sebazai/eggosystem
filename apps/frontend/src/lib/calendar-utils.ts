import type { MatchWithStreamUrls } from "@eggosystem/types";

// Division definitions with darker, more readable colors
export const DIVISIONS: Record<number, { color: string; borderColor: string }> =
  {
    1: { color: "#b91c1c", borderColor: "#991b1b" }, // Darker red
    2: { color: "#1d4ed8", borderColor: "#1e40af" }, // Darker blue
    3: { color: "#047857", borderColor: "#065f46" }, // Darker green
    4: { color: "#b45309", borderColor: "#92400e" }, // Darker orange
    5: { color: "#6d28d9", borderColor: "#5b21b6" }, // Darker purple
    6: { color: "#be185d", borderColor: "#9d174d" }, // Darker pink
    7: { color: "#0e7490", borderColor: "#155e75" }, // Darker cyan
    8: { color: "#4d7c0f", borderColor: "#365314" }, // Darker lime
    9: { color: "#c2410c", borderColor: "#9a3412" }, // Darker red-orange
    10: { color: "#7c3aed", borderColor: "#6d28d9" }, // Darker violet
    11: { color: "#0f766e", borderColor: "#134e4a" }, // Darker teal
    12: { color: "#a16207", borderColor: "#854d0e" } // Darker yellow
  };

/**
 * Sorts matches by date/time first, then by league tier
 * This ensures chronological order with higher-tier matches taking precedence
 * when multiple matches occur at the same time.
 */
export const sortMatchesByDateAndTier = (
  matches: MatchWithStreamUrls[]
): MatchWithStreamUrls[] => {
  return matches.sort((a, b) => {
    // First sort by match date and start time
    const dateA = new Date(a.match_start);
    const dateB = new Date(b.match_start);
    const dateComparison = dateA.getTime() - dateB.getTime();

    // If dates are the same, sort by league tier
    if (dateComparison === 0) {
      return a.league_tier - b.league_tier;
    }

    return dateComparison;
  });
};

/**
 * Filters matches to show only upcoming matches within a specified number of days
 */
export const filterUpcomingMatches = (
  matches: MatchWithStreamUrls[],
  daysAhead: number = 10
): MatchWithStreamUrls[] => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  return matches.filter((match) => {
    const matchDate = new Date(match.match_start);
    return matchDate >= now && matchDate <= futureDate;
  });
};

/**
 * Combines filtering and sorting for upcoming matches
 * Returns matches sorted by date/time first, then by tier
 */
export const getUpcomingMatchesSorted = (
  matches: MatchWithStreamUrls[],
  daysAhead: number = 10,
  maxCount?: number
): MatchWithStreamUrls[] => {
  const filtered = filterUpcomingMatches(matches, daysAhead);
  const sorted = sortMatchesByDateAndTier(filtered);

  if (maxCount) {
    return sorted.slice(0, maxCount);
  }

  return sorted;
};
