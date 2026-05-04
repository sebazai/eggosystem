"use client";

import { useHydrated } from "@/hooks/useHydrated";
import { parseMatchTimestampToDate } from "@/lib/parse-match-timestamp";

interface ClientTimeProps {
  startTimestamp: string;
  endTimestamp?: string | null;
  className?: string;
}

function formatLocalTime(date: Date): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone
  }).format(date);
}

function utcTitleForInstant(date: Date): string {
  return `UTC: ${date.toUTCString()}`;
}

export function MatchClientTime({
  startTimestamp,
  endTimestamp,
  className
}: ClientTimeProps) {
  const hydrated = useHydrated();

  if (!hydrated) {
    return <span className={className}>{"\u00a0"}</span>;
  }

  const startDate = parseMatchTimestampToDate(startTimestamp);
  const formattedStartLocal = formatLocalTime(startDate);
  const startDateTimeUtc = startDate.toISOString();
  const startTitleUtc = utcTitleForInstant(startDate);

  if (endTimestamp) {
    const endDate = parseMatchTimestampToDate(endTimestamp);
    const formattedEndLocal = formatLocalTime(endDate);
    const endDateTimeUtc = endDate.toISOString();
    const endTitleUtc = utcTitleForInstant(endDate);

    return (
      <span className={className}>
        <time
          dateTime={startDateTimeUtc}
          title={startTitleUtc}
          aria-label={formattedStartLocal}
        >
          {formattedStartLocal}
        </time>
        –
        <time
          dateTime={endDateTimeUtc}
          title={endTitleUtc}
          aria-label={formattedEndLocal}
        >
          {formattedEndLocal}
        </time>
      </span>
    );
  }

  return (
    <span className={className}>
      Starts:{" "}
      <time
        dateTime={startDateTimeUtc}
        title={startTitleUtc}
        aria-label={formattedStartLocal}
      >
        {formattedStartLocal}
      </time>
    </span>
  );
}
