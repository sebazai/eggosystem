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

/**
 * Finds the earliest start time and latest end time from a list of matches
 * Adds a 30-minute buffer before and after
 * Returns times in HH:mm:ss format
 */
export const findMinMaxTimes = (matches: MatchWithStreamUrls[]) => {
  if (!matches.length) {
    return {
      minTime: "00:00:00",
      maxTime: "24:00:00"
    };
  }

  // Find earliest start and latest end
  const times = matches.reduce(
    (acc, match) => {
      const startTime = new Date(match.match_start);
      const endTime = new Date(match.match_end);

      if (!acc.earliest || startTime < acc.earliest) {
        acc.earliest = startTime;
      }
      if (!acc.latest || endTime > acc.latest) {
        acc.latest = endTime;
      }

      return acc;
    },
    { earliest: null as Date | null, latest: null as Date | null }
  );

  if (!times.earliest || !times.latest) {
    return {
      minTime: "00:00:00",
      maxTime: "24:00:00"
    };
  }

  // Calculate time range in hours
  const rangeInHours =
    (times.latest.getTime() - times.earliest.getTime()) / (1000 * 60 * 60);

  // Create new Date objects for buffer calculations to avoid modifying originals
  const minDate = new Date(times.earliest);
  const maxDate = new Date(times.latest);

  if (rangeInHours < 10) {
    // For ranges less than 10 hours, center the events in a 10-hour window
    const midPoint = new Date(
      (times.earliest.getTime() + times.latest.getTime()) / 2
    );
    const fiveHoursInMs = 5 * 60 * 60 * 1000;

    minDate.setTime(midPoint.getTime() - fiveHoursInMs);
    maxDate.setTime(midPoint.getTime() + fiveHoursInMs);
  } else {
    // For ranges over 10 hours, just add 30-minute buffer
    minDate.setMinutes(minDate.getMinutes() - 30);
    maxDate.setMinutes(maxDate.getMinutes() + 30);
  }

  // Format times as HH:mm:ss
  let minTime = minDate.toTimeString().slice(0, 8);
  let maxTime = maxDate.toTimeString().slice(0, 8);

  // Convert times to hours for easier calculation
  const minHours =
    minDate.getHours() +
    minDate.getMinutes() / 60 +
    minDate.getSeconds() / 3600;
  let maxHours =
    maxDate.getHours() +
    maxDate.getMinutes() / 60 +
    maxDate.getSeconds() / 3600;

  // If max time is less than min time, add 24 hours to max time
  if (maxHours < minHours) {
    maxHours += 24;
  }

  // Calculate the current range in hours
  const currentRange = maxHours - minHours;

  // If range is less than 10 hours, extend it
  if (currentRange < 10) {
    // Center the events in a 10-hour window
    const midPoint = minHours + currentRange / 2;
    const newMinHours = midPoint - 5; // 5 hours before midpoint
    const newMaxHours = midPoint + 5; // 5 hours after midpoint

    // Convert hours back to HH:mm:ss format
    const minH = Math.floor(newMinHours);
    const minM = Math.floor((newMinHours - minH) * 60);
    const minS = Math.floor(((newMinHours - minH) * 60 - minM) * 60);
    minTime = `${minH.toString().padStart(2, "0")}:${minM.toString().padStart(2, "0")}:${minS.toString().padStart(2, "0")}`;

    const maxH = Math.floor(newMaxHours);
    const maxM = Math.floor((newMaxHours - maxH) * 60);
    const maxS = Math.floor(((newMaxHours - maxH) * 60 - maxM) * 60);
    maxTime = `${maxH.toString().padStart(2, "0")}:${maxM.toString().padStart(2, "0")}:${maxS.toString().padStart(2, "0")}`;
  } else {
    // Add 30-minute buffer on both sides
    const newMinHours = minHours - 0.5;
    const newMaxHours = maxHours + 0.5;

    // Convert hours back to HH:mm:ss format
    const minH = Math.floor(newMinHours);
    const minM = Math.floor((newMinHours - minH) * 60);
    const minS = Math.floor(((newMinHours - minH) * 60 - minM) * 60);
    minTime = `${minH.toString().padStart(2, "0")}:${minM.toString().padStart(2, "0")}:${minS.toString().padStart(2, "0")}`;

    const maxH = Math.floor(newMaxHours);
    const maxM = Math.floor((newMaxHours - maxH) * 60);
    const maxS = Math.floor(((newMaxHours - maxH) * 60 - maxM) * 60);
    maxTime = `${maxH.toString().padStart(2, "0")}:${maxM.toString().padStart(2, "0")}:${maxS.toString().padStart(2, "0")}`;
  }

  // Cap minTime at day boundary
  if (minTime < "00:00:00") minTime = "00:00:00";

  return {
    minTime,
    maxTime
  };
};
