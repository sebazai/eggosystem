import { Suspense } from "react";
import EmbedCalendarClient from "./EmbedCalendarClient";

export const metadata = {
  title: "Calendar Embed | Kanaliiga",
  description: "Embeddable match calendar for Kanaliiga leagues",
  robots: "noindex, nofollow" // Don't index embed pages
};

/**
 * Embeddable Calendar Page
 *
 * This page is designed to be embedded in an iframe on external sites.
 * It renders a calendar showing matches for a specific organizer and game.
 *
 * Query Parameters:
 * - organizer_id: Required. The organizer ID (e.g., "1" for Kanaliiga)
 * - app_id: Required. The Steam app ID (e.g., "730" for CS2)
 * - league_id: Optional. Filter by specific league ID
 * - height: Optional. Height of the calendar (default: "600px")
 * - width: Optional. Width of the calendar (default: "100%")
 * - view: Optional. Initial view - "month" or "week" (default: "month")
 * - theme: Optional. Color theme - "dark" or "light" (default: "dark")
 *
 * Example URL:
 * https://hub.kanaliiga.fi/embed/calendar?organizer_id=1&app_id=730&theme=dark
 *
 * Example iframe:
 * <iframe
 *   src="https://hub.kanaliiga.fi/embed/calendar?organizer_id=1&app_id=730&height=800px&theme=dark"
 *   width="100%"
 *   height="800"
 *   frameborder="0"
 *   style="border:none;"
 * ></iframe>
 */
export default function EmbedCalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading calendar...</p>
          </div>
        </div>
      }
    >
      <EmbedCalendarClient />
    </Suspense>
  );
}
