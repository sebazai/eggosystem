import { MatchStatus, type MatchWithStreamUrls } from "@eggosystem/types";
import {
  numericTierToKey,
  tierCssColor,
  tierCssBorderColor
} from "@/lib/matches/tiers";

// Maps numeric tier values to CSS-variable-based colors from globals.css.
// Tiers 1–3 map to premier/elite/challenge; 4+ map to open.
const buildDivisions = (): Record<
  number,
  { color: string; borderColor: string }
> => {
  const result: Record<number, { color: string; borderColor: string }> = {};
  for (let i = 1; i <= 12; i++) {
    const key = numericTierToKey(i);
    result[i] = {
      color: tierCssColor(key),
      borderColor: tierCssBorderColor(key)
    };
  }
  return result;
};

export const DIVISIONS = buildDivisions();

/**
 * Sorts matches by date/time first, then by stream availability, then by league tier
 * This ensures chronological order with streamed matches taking precedence,
 * followed by higher-tier matches when multiple matches occur at the same time.
 */
export const sortMatchesByDateAndTier = (
  matches: MatchWithStreamUrls[]
): MatchWithStreamUrls[] => {
  return matches.sort((a, b) => {
    // First sort by match date and start time
    const dateA = new Date(a.match_start);
    const dateB = new Date(b.match_start);
    const dateComparison = dateA.getTime() - dateB.getTime();

    // If dates are the same, prioritize streamed matches
    if (dateComparison === 0) {
      const hasStreamA = a.stream_urls && a.stream_urls.length > 0;
      const hasStreamB = b.stream_urls && b.stream_urls.length > 0;

      // If stream availability differs, prioritize streamed matches
      if (hasStreamA !== hasStreamB) {
        return hasStreamA ? -1 : 1; // Streamed matches first
      }

      // If both have same stream status, sort by league tier
      return a.league_tier - b.league_tier;
    }

    return dateComparison;
  });
};

/**
 * Filters matches to show only upcoming matches within a specified number of days
 */
const filterUpcomingMatches = (
  matches: MatchWithStreamUrls[],
  daysAhead: number = 10
): MatchWithStreamUrls[] => {
  const now = new Date();

  // If daysAhead is 0, we want matches on the same day
  if (daysAhead === 0) {
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );

    return matches.filter((match) => {
      const matchDate = new Date(match.match_start);
      return matchDate >= startOfDay && matchDate <= endOfDay;
    });
  }

  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  return matches.filter((match) => {
    if (match.match_status === MatchStatus.ONGOING) {
      return true;
    }
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

export const getUpcomingStreamedMatchesSorted = (
  matches: MatchWithStreamUrls[],
  daysAhead: number = 0,
  maxCount?: number
): MatchWithStreamUrls[] => {
  const filtered = filterUpcomingMatches(matches, daysAhead);
  const sorted = sortMatchesByDateAndTier(filtered);
  const streamedMatches = sorted.filter(
    (match) => match.stream_urls && match.stream_urls.length > 0
  );
  if (maxCount) {
    return streamedMatches.slice(0, maxCount);
  }
  return streamedMatches;
};

/**
 * Finds the earliest start time and latest end time from a list of matches
 * Adds a 30-minute buffer before and after
 * Returns times in HH:mm:ss format
 */
export const findMinMaxTimes = (matches: MatchWithStreamUrls[]) => {
  // Helper function to round to nearest 30 minutes
  const roundToNearest30Min = (hours: number) => {
    const totalMinutes = Math.round((hours * 60) / 30) * 30;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return { hours: h, minutes: m };
  };

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

  // Calculate time range based only on time of day (not full dates)
  const earliestTime =
    times.earliest.getHours() + times.earliest.getMinutes() / 60;
  const latestTime = times.latest.getHours() + times.latest.getMinutes() / 60;

  // Handle cases where events span midnight
  let timeRange = latestTime - earliestTime;
  if (timeRange < 0) {
    timeRange += 24; // Add 24 hours if spanning midnight
  }

  console.log(
    `Time range: ${timeRange} hours (${earliestTime}:00 to ${latestTime}:00)`
  );

  // Create new Date objects for buffer calculations to avoid modifying originals
  const minDate = new Date(times.earliest);
  const maxDate = new Date(times.latest);

  if (timeRange < 10) {
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
  let minTime: string;
  let maxTime: string;

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

    // Convert hours back to HH:mm:ss format, rounded to nearest 30 minutes
    const minRounded = roundToNearest30Min(newMinHours);
    const maxRounded = roundToNearest30Min(newMaxHours);

    minTime = `${minRounded.hours.toString().padStart(2, "0")}:${minRounded.minutes.toString().padStart(2, "0")}:00`;
    maxTime = `${maxRounded.hours.toString().padStart(2, "0")}:${maxRounded.minutes.toString().padStart(2, "0")}:00`;
  } else {
    // Add 30-minute buffer on both sides
    const newMinHours = minHours - 0.5;
    const newMaxHours = maxHours + 0.5;

    // Convert hours back to HH:mm:ss format, rounded to nearest 30 minutes
    const minRounded = roundToNearest30Min(newMinHours);
    const maxRounded = roundToNearest30Min(newMaxHours);

    minTime = `${minRounded.hours.toString().padStart(2, "0")}:${minRounded.minutes.toString().padStart(2, "0")}:00`;
    maxTime = `${maxRounded.hours.toString().padStart(2, "0")}:${maxRounded.minutes.toString().padStart(2, "0")}:00`;
  }

  // Cap minTime at day boundary
  if (minTime < "00:00:00") minTime = "00:00:00";

  return {
    minTime,
    maxTime
  };
};
