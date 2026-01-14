"use client";
import { useMemo } from "react";

interface ClientDateProps {
  matchDate: string;
  startTime?: string;
  className?: string;
}

export function MatchClientDate({
  matchDate,
  startTime,
  className
}: ClientDateProps) {
  const isClient = typeof window !== "undefined";

  // Calculate date from props
  const date = useMemo(() => {
    const dateTime = startTime
      ? `${matchDate}T${startTime}Z`
      : `${matchDate}T00:00:00Z`;
    return new Date(dateTime);
  }, [matchDate, startTime]);

  // Format date - use client timezone if available, otherwise UTC
  const formattedDate = useMemo(() => {
    if (isClient) {
      return date
        .toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "2-digit",
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
        .toUpperCase();
    }
    return date
      .toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "2-digit",
        timeZone: "UTC"
      })
      .toUpperCase();
  }, [date, isClient]);

  return <span className={className}>{formattedDate}</span>;
}
