"use client";
import { useEffect, useState } from "react";

interface ClientTimeProps {
  matchDate: string;
  startTime: string;
  endTime?: string | null;
  className?: string;
}

export function MatchClientTime({
  matchDate,
  startTime,
  endTime,
  className
}: ClientTimeProps) {
  const [formattedTime, setFormattedTime] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  // Helper function to format time consistently
  const formatTimeUTC = (date: Date) => date.toTimeString().slice(0, 5); // HH:MM UTC
  const formatTimeLocal = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  useEffect(() => {
    setIsClient(true);
    const startDate = new Date(`${matchDate}T${startTime}Z`);

    const formattedStart = formatTimeLocal(startDate);

    if (endTime) {
      const endDate = new Date(`${matchDate}T${endTime}Z`);
      const formattedEnd = formatTimeLocal(endDate);
      setFormattedTime(`${formattedStart}–${formattedEnd}`);
    } else {
      setFormattedTime(formattedStart);
    }
  }, [matchDate, startTime, endTime]);

  // Always render UTC time initially to prevent hydration mismatch
  const startDate = new Date(`${matchDate}T${startTime}Z`);
  const formattedStartUTC = formatTimeUTC(startDate);

  if (endTime) {
    const endDate = new Date(`${matchDate}T${endTime}Z`);
    const formattedEndUTC = formatTimeUTC(endDate);
    const displayTime = isClient
      ? formattedTime
      : `${formattedStartUTC}–${formattedEndUTC}`;
    return <span className={className}>{displayTime}</span>;
  } else {
    const displayTime = isClient ? formattedTime : formattedStartUTC;
    return <span className={className}>Starts: {displayTime}</span>;
  }
}
