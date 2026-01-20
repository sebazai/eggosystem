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
    return new Date(startTimestamp);
  }, [startTimestamp]);

  const formattedDate = useMemo(() => {
    return formatDateShort(date, { toUpperCase: true });
  }, [date]);

  return <span className={className}>{formattedDate}</span>;
}
