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
    return formatDateShort(date, {
      timezone: null,
      toUpperCase: true
    });
  }, [date]);

  if (!hydrated) {
    return <span className={className}>{"\u00a0"}</span>;
  }

  return <span className={className}>{formattedDate}</span>;
}
