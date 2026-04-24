"use client";
import { formatDateShort } from "@/lib/date-utils";
import { useMemo } from "react";

interface ClientDateProps {
  startTimestamp: string;
  className?: string;
}

export function MatchClientDate({
  startTimestamp,
  className
}: ClientDateProps) {
  const date = useMemo(() => {
    // If the timestamp lacks an explicit zone (Z or ±hh:mm), treat it as UTC.
    const hasExplicitZone =
      /([zZ]|[+-]\d{2}:\d{2})$/.test(startTimestamp) ||
      /([+-]\d{4})$/.test(startTimestamp);
    return new Date(hasExplicitZone ? startTimestamp : `${startTimestamp}Z`);
  }, [startTimestamp]);

  const formattedDate = useMemo(() => {
    return formatDateShort(date, {
      timezone: "UTC",
      toUpperCase: true
    });
  }, [date]);

  return <span className={className}>{formattedDate}</span>;
}
