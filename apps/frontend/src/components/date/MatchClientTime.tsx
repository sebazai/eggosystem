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
  // Parse ISO timestamp as UTC and format as UTC time string
  const formatTimeUTC = (isoTimestamp: string) => {
    // If the timestamp lacks an explicit zone (Z or ±hh:mm), treat it as UTC.
    const hasExplicitZone =
      /([zZ]|[+-]\d{2}:\d{2})$/.test(isoTimestamp) ||
      /([+-]\d{4})$/.test(isoTimestamp);
    const date = new Date(hasExplicitZone ? isoTimestamp : `${isoTimestamp}Z`);

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
