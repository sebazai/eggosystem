"use client";

import { useSearchParams } from "next/navigation";
import EmbedCalendar from "@/components/embed/EmbedCalendar";

export default function EmbedCalendarClient() {
  const searchParams = useSearchParams();

  // Get query parameters
  const organizerId = searchParams.get("organizer_id") || "";
  const appId = searchParams.get("app_id") || "";
  const leagueId = searchParams.get("league_id") || undefined;
  const height = searchParams.get("height") || "600px";
  const width = searchParams.get("width") || "100%";
  const view = (searchParams.get("view") as "month" | "week") || "month";
  const theme = (searchParams.get("theme") as "dark" | "light") || "light";

  return (
    <EmbedCalendar
      organizerId={organizerId}
      appId={appId}
      leagueId={leagueId}
      height={height}
      width={width}
      view={view}
      theme={theme}
    />
  );
}
