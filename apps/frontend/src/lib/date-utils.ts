export const convertTimeToLocalTimeWithoutSeconds = (time: string) => {
  const date = new Date(time);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
};

/**
 * Converts a datetime-local input value (YYYY-MM-DDTHH:mm) to UTC ISO 8601 format.
 *
 * The datetime-local input provides values in the user's local timezone.
 * This function converts that local time back to UTC for storage in the database.
 *
 * @param localDateTime - The datetime-local string value (e.g., "2025-01-15T18:30")
 * @returns UTC ISO 8601 string (e.g., "2025-01-15T16:30:00.000Z") or null if input is invalid
 *
 * @example
 * // User in Helsinki (UTC+2) enters 18:30 local time
 * convertLocalDateTimeToISO("2025-01-15T18:30")
 * // Returns: "2025-01-15T16:30:00.000Z" (18:30 Helsinki = 16:30 UTC)
 */
export const convertLocalDateTimeToISO = (
  localDateTime: string | null
): string | null => {
  if (!localDateTime) return null;
  try {
    // datetime-local format is YYYY-MM-DDTHH:mm, add seconds if missing
    const dateTimeStr =
      localDateTime.length === 16 ? `${localDateTime}:00` : localDateTime;

    // new Date() interprets datetime-local strings as local time
    // toISOString() converts to UTC automatically
    const localDate = new Date(dateTimeStr);
    return localDate.toISOString();
  } catch {
    return null;
  }
};

/**
 * Converts a UTC ISO 8601 datetime string to datetime-local format (YYYY-MM-DDTHH:mm)
 * for use in HTML datetime-local input fields.
 *
 * The datetime-local input displays times in the user's local timezone automatically.
 * This function converts UTC times from the backend to local time for display.
 *
 * @param dateStr - UTC ISO 8601 string (e.g., "2025-01-15T16:30:00.000Z")
 * @returns datetime-local format string in user's local timezone (e.g., "2025-01-15T18:30" in UTC+2) or null if input is invalid
 *
 * @example
 * // UTC time 16:30 displayed in Helsinki (UTC+2) timezone
 * formatDateTimeForInput("2025-01-15T16:30:00.000Z")
 * // Returns: "2025-01-15T18:30" (16:30 UTC = 18:30 Helsinki)
 */
export const formatDateTimeForInput = (
  dateStr: string | null
): string | null => {
  if (!dateStr) return null;
  try {
    // Parse UTC ISO string - Date object represents the moment in time
    const date = new Date(dateStr);

    // Use local timezone getters (getFullYear, getMonth, etc. return local timezone values)
    // This automatically converts UTC to the user's local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return null;
  }
};

export const formatDateShort = (
  date: Date,
  {
    toUpperCase = true,
    timezone = null,
    withHours = false,
    withMinutes = false
  }: {
    toUpperCase?: boolean;
    timezone?: string | null;
    withHours?: boolean;
    withMinutes?: boolean;
  } = {}
) => {
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "2-digit",
    ...(withHours ? { hour: "2-digit" } : {}),
    ...(withMinutes ? { minute: "2-digit" } : {}),
    timeZone: timezone ?? undefined
  });
  if (toUpperCase) {
    return formattedDate.toUpperCase();
  }
  return formattedDate;
};
