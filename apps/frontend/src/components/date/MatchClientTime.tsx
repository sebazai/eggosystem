"use client";

import { useHydrated } from "@/hooks/useHydrated";
import { parseMatchTimestampToDate } from "@/lib/parse-match-timestamp";

interface ClientTimeProps {
  startTimestamp: string;
  endTimestamp?: string | null;
  className?: string;
}

function formatLocalTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
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

  if (endTimestamp) {
    const formattedEndLocal = formatLocalTime(
      parseMatchTimestampToDate(endTimestamp)
    );

    return (
      <span
        className={className}
      >{`${formattedStartLocal}–${formattedEndLocal}`}</span>
    );
  }

  return <span className={className}>Starts: {formattedStartLocal}</span>;
}
