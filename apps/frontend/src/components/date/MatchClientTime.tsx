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

  useEffect(() => {
    setIsClient(true);
    const startDate = new Date(`${matchDate}T${startTime}Z`);

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    };

    const formattedStart = formatTime(startDate);

    if (endTime) {
      const endDate = new Date(`${matchDate}T${endTime}Z`);
      const formattedEnd = formatTime(endDate);
      setFormattedTime(`${formattedStart}–${formattedEnd}`);
    } else {
      setFormattedTime(formattedStart);
    }
  }, [matchDate, startTime, endTime]);

  // Show server-rendered fallback until hydration
  if (!isClient) {
    const startDate = new Date(`${matchDate}T${startTime}Z`);

    const formatTime = (date: Date) => date.toTimeString().slice(0, 5); // HH:MM
    const formattedStart = formatTime(startDate);

    if (endTime) {
      const endDate = new Date(`${matchDate}T${endTime}Z`);
      const formattedEnd = formatTime(endDate);
      return (
        <span className={className}>{`${formattedStart}–${formattedEnd}`}</span>
      );
    } else {
      return <span className={className}>Starts: {formattedStart}</span>;
    }
  }
  if (endTime) {
    return <span className={className}>{formattedTime}</span>;
  } else {
    return <span className={className}>Starts: {formattedTime}</span>;
  }
}
