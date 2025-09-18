"use client";

import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";

interface NowResponse {
  now: number;
}

interface CalendarRefreshTimes {
  currentTime: Date;
  nextRefreshTimes: Date[];
  lastRefreshTime: Date | null;
  timeUntilNextRefresh: string;
}

/**
 * Hook to fetch current server time and calculate calendar refresh times
 * based on the CRON schedule (every 3 hours at 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00)
 */
export function useCalendarRefreshTimes() {
  const {
    data: nowData,
    error,
    isLoading
  } = useSWR<NowResponse>("/api/v1/now", expressFetcher, {
    refreshInterval: 60000, // Refresh every minute to keep time current
    revalidateOnFocus: true,
    dedupingInterval: 30000 // Dedupe for 30 seconds
  });

  const refreshTimes = (): CalendarRefreshTimes | null => {
    if (!nowData) return null;

    const currentTime = new Date(nowData.now);

    // CRON schedule: "0 */3 * * *" - every 3 hours at minute 0
    // This means: 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00 (Helsinki time)
    const refreshHours = [0, 3, 6, 9, 12, 15, 18, 21];

    // Get current time in Helsinki timezone (where the CRON runs)
    const helsinkiTime = new Date(
      currentTime.toLocaleString("en-US", { timeZone: "Europe/Helsinki" })
    );
    const helsinkiHour = helsinkiTime.getHours();
    const helsinkiMinute = helsinkiTime.getMinutes();

    // Find next refresh times in Helsinki timezone
    const nextHelsinkiRefreshTimes: Date[] = [];
    const helsinkiToday = new Date(helsinkiTime);
    helsinkiToday.setMinutes(0, 0, 0); // Reset to start of hour

    // Check today's remaining refresh times in Helsinki
    for (const hour of refreshHours) {
      if (
        hour > helsinkiHour ||
        (hour === helsinkiHour && helsinkiMinute === 0)
      ) {
        const refreshTime = new Date(helsinkiToday);
        refreshTime.setHours(hour, 0, 0, 0);
        nextHelsinkiRefreshTimes.push(refreshTime);

        if (nextHelsinkiRefreshTimes.length >= 3) break;
      }
    }

    // If we need more refresh times, get from tomorrow in Helsinki
    if (nextHelsinkiRefreshTimes.length < 3) {
      const helsinkiTomorrow = new Date(helsinkiToday);
      helsinkiTomorrow.setDate(helsinkiTomorrow.getDate() + 1);

      for (const hour of refreshHours) {
        const refreshTime = new Date(helsinkiTomorrow);
        refreshTime.setHours(hour, 0, 0, 0);
        nextHelsinkiRefreshTimes.push(refreshTime);

        if (nextHelsinkiRefreshTimes.length >= 3) break;
      }
    }

    // Calculate last refresh time in Helsinki
    let lastHelsinkiRefreshTime: Date | null = null;
    for (const hour of refreshHours) {
      if (
        hour < helsinkiHour ||
        (hour === helsinkiHour && helsinkiMinute > 0)
      ) {
        const refreshTime = new Date(helsinkiToday);
        refreshTime.setHours(hour, 0, 0, 0);
        lastHelsinkiRefreshTime = refreshTime;
      }
    }

    // If no refresh time today, get the last one from yesterday in Helsinki
    if (!lastHelsinkiRefreshTime) {
      const helsinkiYesterday = new Date(helsinkiToday);
      helsinkiYesterday.setDate(helsinkiYesterday.getDate() - 1);
      const lastHour = refreshHours[refreshHours.length - 1] ?? 21;
      lastHelsinkiRefreshTime = new Date(helsinkiYesterday);
      lastHelsinkiRefreshTime.setHours(lastHour, 0, 0, 0);
    }

    // Convert Helsinki times to client timezone
    const convertHelsinkiToClient = (helsinkiDate: Date): Date => {
      // Create a date string in Helsinki timezone
      const helsinkiDateStr = helsinkiDate.toLocaleString("sv-SE", {
        timeZone: "Europe/Helsinki",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });

      // Parse it as if it were in the client's timezone
      return new Date(helsinkiDateStr.replace(" ", "T"));
    };

    const nextRefreshTimes = nextHelsinkiRefreshTimes.map(
      convertHelsinkiToClient
    );
    const lastRefreshTime = lastHelsinkiRefreshTime
      ? convertHelsinkiToClient(lastHelsinkiRefreshTime)
      : null;

    // Calculate time until next refresh (using client time)
    const nextRefresh = nextRefreshTimes[0];
    const timeUntilNext = nextRefresh
      ? nextRefresh.getTime() - currentTime.getTime()
      : 0;

    const formatTimeUntil = (ms: number): string => {
      const hours = Math.floor(ms / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    };

    return {
      currentTime: currentTime, // Use client time
      nextRefreshTimes: nextRefreshTimes.slice(0, 3),
      lastRefreshTime,
      timeUntilNextRefresh: formatTimeUntil(timeUntilNext)
    };
  };

  return {
    refreshTimes: refreshTimes(),
    isLoading,
    error
  };
}
