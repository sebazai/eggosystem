"use client";

import { formatDateShort } from "@/lib/date-utils";
import { useHydrated } from "@/hooks/useHydrated";
import { parseMatchTimestampToDate } from "@/lib/parse-match-timestamp";
import { useMemo } from "react";

interface ClientDateProps {
  startTimestamp: string;
  className?: string;
}

export function MatchClientDate({
  startTimestamp,
  className
}: ClientDateProps) {
  const hydrated = useHydrated();

  const date = useMemo(
    () => parseMatchTimestampToDate(startTimestamp),
    [startTimestamp]
  );

  const formattedDate = useMemo(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return formatDateShort(date, {
      timezone: timeZone,
      toUpperCase: true
    });
  }, [date]);

  if (!hydrated) {
    return <span className={className}>{"\u00a0"}</span>;
  }

  const dateTimeUtc = date.toISOString();
  const titleUtc = `UTC: ${date.toUTCString()}`;

  return (
    <time
      className={className}
      dateTime={dateTimeUtc}
      title={titleUtc}
      aria-label={formattedDate}
    >
      {formattedDate}
    </time>
  );
}
