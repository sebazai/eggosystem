import { format as formatDate, parseISO } from "date-fns";
import { format as formatTz } from "date-fns-tz";

/**
 * Converts a UTC date string to the user's local timezone and formats it
 */
export const formatInTimezone = (
  utcDateString: string,
  formatString: string = "PPP 'at' p"
): string => {
  // Parse UTC string and convert to user's local timezone
  const date = parseISO(utcDateString);
  return formatDate(date, formatString);
};

/**
 * Converts a UTC date string to a specific timezone and formats it
 */
export const formatInSpecificTimezone = (
  utcDateString: string,
  timezone: string,
  formatString: string = "PPP 'at' p"
): string => {
  const utcDate = parseISO(utcDateString);
  return formatTz(utcDate, formatString, { timeZone: timezone });
};

/**
 * Gets the user's current timezone
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Converts UTC date string to local Date object
 */
export const utcToLocalDate = (utcDateString: string): Date => {
  return parseISO(utcDateString);
};
