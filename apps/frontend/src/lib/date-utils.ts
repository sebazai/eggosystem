export const convertTimeToLocalTimeWithoutSeconds = (time: string) => {
  const date = new Date(time);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
};

/**
 * Converts a datetime-local input value (YYYY-MM-DDTHH:mm) to UTC ISO 8601 format
 * @param localDateTime - The datetime-local string value (e.g., "2025-01-15T18:30")
 * @returns UTC ISO 8601 string (e.g., "2025-01-15T16:30:00.000Z") or null if input is invalid
 *
 * @example
 * // User in Helsinki (UTC+2) enters 18:30
 * convertLocalDateTimeToISO("2025-01-15T18:30")
 * // Returns: "2025-01-15T16:30:00.000Z" (18:30 Helsinki = 16:30 UTC)
 */
export const convertLocalDateTimeToISO = (
  localDateTime: string | null
): string | null => {
  if (!localDateTime) return null;
  try {
    // Parse as local time and convert to ISO string
    // datetime-local format is YYYY-MM-DDTHH:mm, we need to add seconds
    const dateTimeStr =
      localDateTime.length === 16 ? `${localDateTime}:00` : localDateTime;
    const localDate = new Date(dateTimeStr);
    return localDate.toISOString();
  } catch {
    return null;
  }
};

/**
 * Converts a UTC ISO 8601 datetime string to datetime-local format (YYYY-MM-DDTHH:mm)
 * for use in HTML datetime-local input fields
 * @param dateStr - UTC ISO 8601 string (e.g., "2025-01-15T16:30:00.000Z")
 * @returns datetime-local format string (e.g., "2025-01-15T18:30") or null if input is invalid
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
    // Parse UTC date string
    const utcDate = new Date(dateStr);
    // Get local date components
    const year = utcDate.getFullYear();
    const month = String(utcDate.getMonth() + 1).padStart(2, "0");
    const day = String(utcDate.getDate()).padStart(2, "0");
    const hours = String(utcDate.getHours()).padStart(2, "0");
    const minutes = String(utcDate.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return null;
  }
};

export const formatDateShort = (
  date: Date,
  {
    toUpperCase = true,
    timezone = "UTC",
    withHours = false,
    withMinutes = false
  }: {
    toUpperCase?: boolean;
    timezone?: string;
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
    timeZone: timezone
  });
  if (toUpperCase) {
    return formattedDate.toUpperCase();
  }
  return formattedDate;
};
