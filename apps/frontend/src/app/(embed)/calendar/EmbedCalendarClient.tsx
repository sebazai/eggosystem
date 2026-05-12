"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import EmbedCalendar from "@/components/embed/EmbedCalendar";

function safeDecode(value: string | null): string {
  if (!value) return "100%";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function EmbedCalendarClient() {
  const searchParams = useSearchParams();

  const height = useMemo(
    () => safeDecode(searchParams.get("height")) || "100%",
    [searchParams]
  );
  const width = useMemo(
    () => safeDecode(searchParams.get("width")) || "100%",
    [searchParams]
  );

  // Get query parameters
  const organizerId = searchParams.get("organizer_id") || "";
  const appId = searchParams.get("app_id") || "";
  const leagueId = searchParams.get("league_id") || undefined;
  const view = (searchParams.get("view") as "month" | "week") || "month";
  const theme = (searchParams.get("theme") as "dark" | "light") || "light";

  return (
    <div style={{ height, width, overflow: "visible" }}>
      <EmbedCalendar
        organizerId={organizerId}
        appId={appId}
        leagueId={leagueId}
        height={height}
        width={width}
        view={view}
        theme={theme}
      />
    </div>
  );
}
