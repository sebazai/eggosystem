/**
 * Formats a UTC date for database insertion (MySQL format)
 *
 * **Note:** This is a lightweight version that doesn't require moment-timezone.
 * There is also a version in `apps/backend/src/utils/date-utils.ts` that uses moment-timezone.
 * Both produce identical results. This version is used in Zod schema transforms where
 * we want to avoid external dependencies.
 *
 * **Timezone Handling:**
 * - If input has timezone info (e.g., `+02:00`, `-05:00`, `Z`), it's converted to UTC
 * - If input has NO timezone info, it's **assumed to be UTC**
 *
 * @param utcDate - Date object or ISO 8601 string (with or without timezone)
 * @returns MySQL datetime format string in UTC (e.g., '2025-01-15 10:30:00')
 *
 * @example
 * formatDateForDatabase('2024-01-15T18:30:00.000Z') // → '2024-01-15 18:30:00'
 * formatDateForDatabase('2024-01-15T20:30:00.000+02:00') // → '2024-01-15 18:30:00'
 * formatDateForDatabase('2024-01-15T18:30:00.000') // → '2024-01-15 18:30:00' (assumed UTC)
 * formatDateForDatabase(new Date('2024-01-15T18:30:00.000Z')) // → '2024-01-15 18:30:00'
 */
export const formatDateForDatabase = (utcDate: Date | string): string => {
  // Convert to ISO string if it's a Date object
  const isoString =
    typeof utcDate === "string" ? utcDate : utcDate.toISOString();

  // Parse the ISO string - JavaScript Date handles timezone conversion automatically
  const date = new Date(isoString);

  // Extract UTC components and format as MySQL datetime
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
