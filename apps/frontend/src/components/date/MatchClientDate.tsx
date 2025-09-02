"use client";
import { useEffect, useState } from "react";

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
  const [formattedDate, setFormattedDate] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const dateTime = startTime
      ? `${matchDate}T${startTime}Z`
      : `${matchDate}T00:00:00Z`;
    const date = new Date(dateTime);

    const formatted = date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "2-digit",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    setFormattedDate(formatted.toUpperCase());
  }, [matchDate, startTime]);

  // Show server-rendered fallback until hydration
  if (!isClient) {
    const dateTime = startTime
      ? `${matchDate}T${startTime}Z`
      : `${matchDate}T00:00:00Z`;
    const date = new Date(dateTime);
    const fallbackFormatted = date
      .toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "2-digit",
        timeZone: "UTC"
      })
      .toUpperCase();

    return <span className={className}>{fallbackFormatted}</span>;
  }

  return <span className={className}>{formattedDate}</span>;
}
