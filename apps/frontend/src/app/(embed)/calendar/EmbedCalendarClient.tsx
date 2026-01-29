"use client";

import { useSearchParams } from "next/navigation";
import EmbedCalendar from "@/components/embed/EmbedCalendar";

export default function EmbedCalendarClient() {
  const searchParams = useSearchParams();

  // Get query parameters
  const organizerId = searchParams.get("organizer_id") || "";
  const appId = searchParams.get("app_id") || "";
  const leagueId = searchParams.get("league_id") || undefined;
  const height = searchParams.get("height") || undefined;
  const width = searchParams.get("width") || undefined;
  const view = (searchParams.get("view") as "month" | "week") || "month";
  const theme = (searchParams.get("theme") as "dark" | "light") || "light";

  return (
    <div style={{ height: "50%", width: "100%" }}>
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
