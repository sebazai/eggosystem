"use client";
import { useEffect, useState } from "react";

interface ClientDateDisplayProps {
  /**
   * UTC date string in ISO 8601 format (e.g., '2025-01-15T10:30:00Z')
   */
  utcDateString: string;
  className?: string;
}

/**
 * Client-side component that displays a UTC date in the user's local timezone.
 * Shows UTC time on server-side render, then updates to local time after hydration.
 */
export function ClientDateDisplay({
  utcDateString,
  className
}: ClientDateDisplayProps) {
  const [formattedDate, setFormattedDate] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Use setTimeout to defer state update and avoid cascading renders
    const timeoutId = setTimeout(() => {
      setIsClient(true);
      try {
        const date = new Date(utcDateString);
        // Format in user's local timezone
        const formatted = date.toLocaleString(undefined, {
          dateStyle: "long",
          timeStyle: "short"
        });
        setFormattedDate(formatted);
      } catch (_error) {
        // Fallback to UTC string if parsing fails
        setFormattedDate(utcDateString);
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [utcDateString]);

  // Show server-rendered fallback (UTC) until hydration
  if (!isClient) {
    let fallbackFormatted: string;
    try {
      const date = new Date(utcDateString);
      fallbackFormatted = date.toLocaleString("en-US", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "UTC"
      });
    } catch (_error) {
      fallbackFormatted = utcDateString;
    }
    return <span className={className}>{fallbackFormatted} UTC</span>;
  }

  return <span className={className}>{formattedDate}</span>;
}
