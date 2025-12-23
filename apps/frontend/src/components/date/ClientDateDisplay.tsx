"use client";
import { useEffect, useState } from "react";

interface ClientDateDisplayProps {
  /**
   * UTC date string in ISO 8601 format (e.g., '2025-01-15T10:30:00Z')
   */
  utcDateString: string;
  /**
   * Format options for date display
   * @default "PPP 'at' p" (e.g., "January 15, 2025 at 10:30 AM")
   */
  format?: string;
  className?: string;
}

/**
 * Client-side component that displays a UTC date in the user's local timezone.
 * Shows UTC time on server-side render, then updates to local time after hydration.
 */
export function ClientDateDisplay({
  utcDateString,
  format = "PPP 'at' p",
  className
}: ClientDateDisplayProps) {
  const [formattedDate, setFormattedDate] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const date = new Date(utcDateString);
      // Format in user's local timezone
      const formatted = date.toLocaleString(undefined, {
        dateStyle: "long",
        timeStyle: "short"
      });
      setFormattedDate(formatted);
    } catch (error) {
      // Fallback to UTC string if parsing fails
      setFormattedDate(utcDateString);
    }
  }, [utcDateString]);

  // Show server-rendered fallback (UTC) until hydration
  if (!isClient) {
    try {
      const date = new Date(utcDateString);
      const fallbackFormatted = date.toLocaleString("en-US", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "UTC"
      });
      return <span className={className}>{fallbackFormatted} UTC</span>;
    } catch (error) {
      return <span className={className}>{utcDateString} UTC</span>;
    }
  }

  return <span className={className}>{formattedDate}</span>;
}
