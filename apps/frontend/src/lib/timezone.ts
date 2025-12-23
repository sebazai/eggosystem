import { format as formatDate, parseISO } from "date-fns";

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
