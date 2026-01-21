import moment from "moment-timezone";

/**
 * Formats a UTC date for database insertion (MySQL format)
 *
 * **Timezone Handling:**
 * - If input has timezone info (e.g., `+02:00`, `-05:00`, `Z`), it's converted to UTC
 * - If input has NO timezone info, it's **assumed to be UTC** (moment.utc() behavior)
 * - This means timestamps without timezone are treated as UTC, not local time
 *
 * @param utcDate - Date object or ISO string (with or without timezone)
 * @returns MySQL datetime format string in UTC (e.g., '2025-01-15 10:30:00')
 *
 * @example
 * // With UTC timezone
 * formatDateForDatabase('2024-01-15T18:30:00.000Z') // → '2024-01-15 18:30:00'
 *
 * // With timezone offset (converted to UTC)
 * formatDateForDatabase('2024-01-15T20:30:00.000+02:00') // → '2024-01-15 18:30:00'
 *
 * // Without timezone (assumed UTC)
 * formatDateForDatabase('2024-01-15T18:30:00.000') // → '2024-01-15 18:30:00'
 */
export const formatDateForDatabase = (utcDate: Date | string): string => {
  // Parse directly as UTC to avoid timezone issues
  // If it's a string, parse it as UTC ISO string
  // If it's a Date object, convert to ISO string first, then parse as UTC
  const isoString =
    typeof utcDate === "string" ? utcDate : utcDate.toISOString();
  const utcMoment = moment.utc(isoString);
  // Format as MySQL datetime (YYYY-MM-DD HH:mm:ss)
  return utcMoment.format("YYYY-MM-DD HH:mm:ss");
};

export const getSevenDaysLaterInMillis = () => {
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return sevenDaysLater.getTime();
};

export const getMonthDifference = (timestamp1: number, timestamp2: number) => {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);

  const yearsDiff = date2.getFullYear() - date1.getFullYear();
  const monthsDiff = date2.getMonth() - date1.getMonth();

  return yearsDiff * 12 + monthsDiff;
};

export const convertISOToFinnishTime = (isoString: string) => {
  const utcDate = moment(isoString);
  const finnishTime = utcDate
    .tz("Europe/Helsinki")
    .format("YYYY-MM-DD HH:mm:ss");
  return finnishTime;
};

export const generateYMD = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getNextWednesdayMatchTime = (): string => {
  const now = moment();

  // Find next Wednesday
  const nextWednesday = now.clone().day(3); // 3 = Wednesday
  if (nextWednesday.isSameOrBefore(now)) {
    nextWednesday.add(1, "week");
  }

  // Set to 20:00 Helsinki time
  const helsinkiTime = nextWednesday
    .tz("Europe/Helsinki")
    .hour(20)
    .minute(0)
    .second(0)
    .millisecond(0);

  // Convert to UTC for database storage and return as ISO string
  const utcTime = helsinkiTime.utc();
  return utcTime.toISOString();
};

/**
 * Gets match timestamp from scheduled time or defaults to next Wednesday
 * @param scheduledAt - Unix timestamp in seconds (optional)
 * @returns ISO 8601 timestamp string (UTC)
 */
export const getFaceitMatchDateTime = (scheduledAt?: number): string => {
  if (scheduledAt) {
    const date = new Date(scheduledAt * 1000);
    return date.toISOString();
  }

  return getNextWednesdayMatchTime();
};

/**
 * Adjusts a match timestamp by adding hours, minutes, or days
 * @param timestamp - ISO 8601 timestamp string (UTC)
 * @param options - Object with hours, minutes, and/or days to add
 * @returns ISO 8601 timestamp string (UTC)
 */
export const adjustMatchDateTime = (
  timestamp: string,
  options: {
    hours?: number;
    minutes?: number;
    days?: number;
  } = {}
): string => {
  const { hours = 0, minutes = 0, days = 0 } = options;

  // Parse the timestamp
  const date = new Date(timestamp);

  // Add the specified time
  date.setHours(date.getUTCHours() + hours);
  date.setMinutes(date.getUTCMinutes() + minutes);
  date.setUTCDate(date.getUTCDate() + days);

  // Return as ISO string
  return date.toISOString();
};
