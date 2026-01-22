export const convertTimeToLocalTimeWithoutSeconds = (time: string) => {
  const date = new Date(time);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
};

export const formatDateForInput = (dateStr: string | null): string | null => {
  if (!dateStr) return null;
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // Otherwise, parse ISO format and convert to YYYY-MM-DD
  try {
    const date = new Date(dateStr);
    return date.toISOString().split("T")[0] || null;
  } catch {
    return null;
  }
};

export const formatDateTimeForInput = (
  dateStr: string | null
): string | null => {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
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

/**
 * Converts a datetime-local input value to ISO UTC format
 *
 * datetime-local inputs return values like "2025-01-15T10:30" which are
 * interpreted as local time. This function converts them to UTC ISO format.
 *
 * @param datetimeLocal - datetime-local format string (e.g., "2025-01-15T10:30")
 * @returns ISO UTC format string (e.g., "2025-01-15T08:30:00.000Z") or null if invalid
 *
 * @example
 * // User in UTC+2 enters "2025-01-15T10:30" (10:30 local time)
 * convertLocalDateTimeToISO("2025-01-15T10:30") // → "2025-01-15T08:30:00.000Z" (08:30 UTC)
 */
export const convertLocalDateTimeToISO = (
  datetimeLocal: string | null
): string | null => {
  if (!datetimeLocal) return null;

  try {
    // datetime-local format is "YYYY-MM-DDTHH:mm"
    // JavaScript Date constructor interprets this as local time
    const date = new Date(datetimeLocal);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return null;
    }

    // Convert to ISO UTC format
    return date.toISOString();
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
