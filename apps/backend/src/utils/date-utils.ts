import moment from "moment-timezone";

/**
 * Formats a UTC date for database insertion (MySQL format)
 * @param utcDate - Date object or ISO string in UTC
 * @returns MySQL datetime format string (e.g., '2025-01-15 10:30:00')
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

/**
 * Converts a database date string to ISO 8601 format with UTC indicator
 * Database returns dates as strings (due to dateStrings: true)
 * For timestamp columns, MariaDB returns them in session timezone (UTC after our migration)
 * @param dbDateString - Date string from database (YYYY-MM-DD HH:mm:ss format)
 * @returns ISO 8601 string with UTC indicator (e.g., '2025-01-15T10:30:00Z') or null
 */
export const formatDateFromDatabase = (
  dbDateString: string | null | undefined
): string | null => {
  if (!dbDateString) {
    return null;
  }
  // Parse as UTC (since session timezone is UTC)
  const utcMoment = moment.utc(dbDateString, "YYYY-MM-DD HH:mm:ss");
  // Return as ISO string with Z indicator
  return utcMoment.toISOString();
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

export const convertISOToTime = (isoString: string) => {
  return new Date(isoString).toISOString().slice(11, 19);
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

export const getNextWednesdayMatchTime = () => {
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

  // Convert to UTC for database storage
  const utcTime = helsinkiTime.utc();

  const match_date = utcTime.format("YYYY-MM-DD");
  const start_time = utcTime.format("HH:mm:ss");

  return { match_date, start_time };
};

export const getMatchDateTime = (scheduledAt?: number) => {
  if (scheduledAt) {
    const date = new Date(scheduledAt * 1000);
    const match_date = date.toISOString().slice(0, 10); // YYYY-MM-DD
    const start_time = date.toISOString().slice(11, 19); // HH:MM:SS
    return { match_date, start_time };
  }

  return getNextWednesdayMatchTime();
};

export const adjustMatchDateTime = (
  match_date: string,
  start_time: string,
  options: {
    hours?: number;
    minutes?: number;
    days?: number;
  } = {}
) => {
  const { hours = 0, minutes = 0, days = 0 } = options;

  // Create a date object from the match_date and start_time
  const dateTimeString = `${match_date}T${start_time}Z`;
  const date = new Date(dateTimeString);

  // Add the specified time
  date.setHours(date.getHours() + hours);
  date.setMinutes(date.getMinutes() + minutes);
  date.setDate(date.getDate() + days);

  // Extract the new date and time
  const new_match_date = date.toISOString().slice(0, 10); // YYYY-MM-DD
  const new_start_time = date.toISOString().slice(11, 19); // HH:MM:SS

  return { match_date: new_match_date, start_time: new_start_time };
};
