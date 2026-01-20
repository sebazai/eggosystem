"use client";
interface ClientTimeProps {
  startTimestamp: string;
  endTimestamp?: string | null;
  className?: string;
}

export function MatchClientTime({
  startTimestamp,
  endTimestamp,
  className
}: ClientTimeProps) {
  // Helper function to format time consistently
  // Parse ISO timestamp (UTC) and format as UTC time string
  const formatTimeUTC = (isoTimestamp: string) => {
    const date = new Date(isoTimestamp);
    // Use UTC methods to ensure we're showing UTC time
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const formattedStartUTC = formatTimeUTC(startTimestamp);

  if (endTimestamp) {
    const formattedEndUTC = formatTimeUTC(endTimestamp);

    return (
      <span
        className={className}
      >{`${formattedStartUTC}–${formattedEndUTC}`}</span>
    );
  } else {
    return <span className={className}>Starts: {formattedStartUTC}</span>;
  }
}
