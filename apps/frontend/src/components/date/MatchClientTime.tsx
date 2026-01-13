interface ClientTimeProps {
  matchDate: string;
  startTime: string;
  endTime?: string | null;
  className?: string;
}

export function MatchClientTime({
  matchDate,
  startTime,
  endTime,
  className
}: ClientTimeProps) {
  // Use lazy initialization for client-side check - already initialized correctly
  const isClient = typeof window !== "undefined";

  // Helper function to format time consistently
  const formatTimeUTC = (date: Date) => date.toTimeString().slice(0, 5); // HH:MM UTC
  const formatTimeLocal = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  // Always render UTC time initially to prevent hydration mismatch
  const startDate = new Date(`${matchDate}T${startTime}Z`);
  const formattedStartUTC = formatTimeUTC(startDate);

  if (endTime) {
    const endDate = new Date(`${matchDate}T${endTime}Z`);
    const formattedEndUTC = formatTimeUTC(endDate);

    if (isClient) {
      // Only format local time on client after hydration
      const formattedStart = formatTimeLocal(startDate);
      const formattedEnd = formatTimeLocal(endDate);
      return (
        <span className={className}>{`${formattedStart}–${formattedEnd}`}</span>
      );
    } else {
      // Always show UTC time on server and initial client render
      return (
        <span
          className={className}
        >{`${formattedStartUTC}–${formattedEndUTC}`}</span>
      );
    }
  } else {
    if (isClient) {
      // Only format local time on client after hydration
      const formattedStart = formatTimeLocal(startDate);
      return <span className={className}>Starts: {formattedStart}</span>;
    } else {
      // Always show UTC time on server and initial client render
      return <span className={className}>Starts: {formattedStartUTC}</span>;
    }
  }
}
