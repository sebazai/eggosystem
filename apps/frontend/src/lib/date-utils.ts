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
