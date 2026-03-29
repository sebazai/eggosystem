"use client";

import { useMemo, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  EventClickArg,
  EventContentArg,
  MoreLinkContentArg
} from "@fullcalendar/core";
import useSWR from "swr";
import type { MatchWithStreamUrls } from "@eggosystem/types";
import { formatInTimezone } from "@/lib/timezone";
import { Clock } from "lucide-react";

// Division definitions with darker, more readable colors
const DIVISIONS: Record<number, { color: string; borderColor: string }> = {
  1: { color: "#b91c1c", borderColor: "#991b1b" }, // Darker red
  2: { color: "#1d4ed8", borderColor: "#1e40af" }, // Darker blue
  3: { color: "#047857", borderColor: "#065f46" }, // Darker green
  4: { color: "#b45309", borderColor: "#92400e" }, // Darker orange
  5: { color: "#6d28d9", borderColor: "#5b21b6" }, // Darker purple
  6: { color: "#be185d", borderColor: "#9d174d" }, // Darker pink
  7: { color: "#0e7490", borderColor: "#155e75" }, // Darker cyan
  8: { color: "#4d7c0f", borderColor: "#365314" }, // Darker lime
  9: { color: "#c2410c", borderColor: "#9a3412" }, // Darker red-orange
  10: { color: "#7c3aed", borderColor: "#6d28d9" }, // Darker violet
  11: { color: "#0f766e", borderColor: "#134e4a" }, // Darker teal
  12: { color: "#a16207", borderColor: "#854d0e" } // Darker yellow
};

const expressFetcher = (url: string) =>
  fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`).then((res) => res.json());

const sortMatchesByDateAndTier = (
  matches: MatchWithStreamUrls[]
): MatchWithStreamUrls[] => {
  return matches.sort((a, b) => {
    const dateA = new Date(a.match_start);
    const dateB = new Date(b.match_start);
    const dateComparison = dateA.getTime() - dateB.getTime();

    if (dateComparison === 0) {
      const hasStreamA = a.stream_urls && a.stream_urls.length > 0;
      const hasStreamB = b.stream_urls && b.stream_urls.length > 0;

      if (hasStreamA !== hasStreamB) {
        return hasStreamA ? -1 : 1;
      }

      return a.league_tier - b.league_tier;
    }

    return dateComparison;
  });
};

const transformMatchesToEvents = (matches: MatchWithStreamUrls[]) => {
  const sortedMatches = sortMatchesByDateAndTier(matches);

  return sortedMatches.map((match, index) => {
    const hasStream = match.stream_urls && match.stream_urls.length > 0;

    return {
      id: match.match_id,
      title: match.title,
      start: match.match_start,
      end: match.match_end,
      backgroundColor: DIVISIONS[match.league_tier]?.color || "#6b7280",
      borderColor: hasStream
        ? "#f59e0b"
        : DIVISIONS[match.league_tier]?.borderColor || "#4b5563",
      displayOrder: index,
      classNames: hasStream ? "stream-match" : "",
      extendedProps: {
        league: match.league_name,
        streamUrl: match.stream_urls,
        team1: match.match_team1,
        team2: match.match_team2,
        tier: match.league_tier,
        hasStream: hasStream,
        status: match.match_status,
        matchId: match.match_id,
        externalMatchRoomId: match.external_match_room_id,
        seasonPlatform: match.season_platform,
        sortOrder: index
      }
    };
  });
};

const findMinMaxTimes = (matches: MatchWithStreamUrls[]) => {
  if (!matches.length) {
    // Default time range for esports (evening matches)
    return { minTime: "16:00:00", maxTime: "24:00:00" };
  }

  // Calculate actual time range from matches
  let earliestHour = 24;
  let latestHour = 0;

  matches.forEach((match) => {
    const startTime = new Date(match.match_start);
    const endTime = new Date(match.match_end);

    const startHour = startTime.getHours();
    const endHour = endTime.getHours() + (endTime.getMinutes() > 0 ? 1 : 0);

    if (startHour < earliestHour) earliestHour = startHour;
    if (endHour > latestHour) latestHour = endHour;
  });

  // Add 1 hour buffer and ensure reasonable bounds
  const minHour = Math.max(0, earliestHour - 1);
  const maxHour = Math.min(24, latestHour + 1);

  // Ensure at least an 8-hour window for better visibility
  const range = maxHour - minHour;
  if (range < 8) {
    const padding = Math.ceil((8 - range) / 2);
    return {
      minTime: `${Math.max(0, minHour - padding)
        .toString()
        .padStart(2, "0")}:00:00`,
      maxTime: `${Math.min(24, maxHour + padding)
        .toString()
        .padStart(2, "0")}:00:00`
    };
  }

  return {
    minTime: `${minHour.toString().padStart(2, "0")}:00:00`,
    maxTime: `${maxHour.toString().padStart(2, "0")}:00:00`
  };
};

const POPOVER_VIEWPORT_PADDING_PX = 10;

function parseCssPixelLength(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * FullCalendar positions the "more" popover without ensuring it fits the calendar box.
 * Clamp to `boundsElement`'s client rect so the popover stays inside the embed calendar
 * (not only the window — the calendar can be smaller than the viewport on themed pages).
 */
function clampFullCalendarMorePopover(
  popover: HTMLElement,
  boundsElement: HTMLElement
): void {
  const bounds = boundsElement.getBoundingClientRect();
  const pad = POPOVER_VIEWPORT_PADDING_PX;
  const maxRight = bounds.right - pad;
  const minLeft = bounds.left + pad;
  const maxBottom = bounds.bottom - pad;
  const minTop = bounds.top + pad;

  const maxPopoverWidth = Math.max(0, bounds.width - 2 * pad);
  if (maxPopoverWidth > 0) {
    popover.style.boxSizing = "border-box";
    popover.style.maxWidth = `${maxPopoverWidth}px`;
  }

  const computed = window.getComputedStyle(popover);
  let topPx = parseCssPixelLength(
    popover.style.top !== "" ? popover.style.top : computed.top
  );
  let leftPx = parseCssPixelLength(
    popover.style.left !== "" ? popover.style.left : computed.left
  );

  const nudgeVertical = (): void => {
    const rect = popover.getBoundingClientRect();
    let deltaY = 0;
    if (rect.bottom > maxBottom) {
      deltaY = rect.bottom - maxBottom;
    }
    const topAfter = rect.top - deltaY;
    if (topAfter < minTop) {
      deltaY = rect.top - minTop;
    }
    if (deltaY !== 0) {
      topPx -= deltaY;
      popover.style.top = `${topPx}px`;
    }
  };

  const nudgeHorizontal = (): void => {
    const rect = popover.getBoundingClientRect();
    let deltaX = 0;
    if (rect.right > maxRight) {
      deltaX = rect.right - maxRight;
    }
    const leftAfter = rect.left - deltaX;
    if (leftAfter < minLeft) {
      deltaX = rect.left - minLeft;
    }
    if (deltaX !== 0) {
      leftPx -= deltaX;
      popover.style.left = `${leftPx}px`;
    }
  };

  nudgeVertical();
  nudgeHorizontal();
  nudgeVertical();
  nudgeHorizontal();
  nudgeVertical();

  // After moving the popover (e.g. from bottom "+ more" to top), FullCalendar may have
  // left a small height from the pre-move layout. Always cap to available space below the
  // popover top and make the body scroll so "+40 more" lists are usable.
  const rect = popover.getBoundingClientRect();
  const maxTotalH = Math.max(0, maxBottom - rect.top);
  if (maxTotalH > 0) {
    popover.style.maxHeight = `${maxTotalH}px`;
    popover.style.display = "flex";
    popover.style.flexDirection = "column";
    popover.style.minHeight = "0";
    const body = popover.querySelector(".fc-popover-body");
    if (body instanceof HTMLElement) {
      body.style.setProperty("max-height", "none", "important");
      body.style.overflowY = "auto";
      body.style.minHeight = "0";
      body.style.flex = "1 1 auto";
    }
  }
}

interface EmbedCalendarProps {
  organizerId: string;
  appId: string;
  leagueId?: string;
  height?: string;
  width?: string;
  view?: "month" | "week";
  theme?: "dark" | "light";
}

export default function EmbedCalendar({
  organizerId,
  appId,
  leagueId,
  height = undefined,
  width = undefined,
  view: defaultView = "month",
  theme = "light"
}: EmbedCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const embedContainerRef = useRef<HTMLDivElement>(null);
  const view: "dayGridMonth" | "timeGridWeek" =
    defaultView === "week" ? "timeGridWeek" : "dayGridMonth";

  // Build the API URL
  const apiUrl = useMemo(() => {
    let url = `/api/v1/calendar/organizers/${organizerId}/apps/${appId}/matches`;
    if (leagueId) {
      url += `?league_id=${leagueId}`;
    }
    return url;
  }, [organizerId, appId, leagueId]);

  const { data: matches, isLoading } = useSWR<MatchWithStreamUrls[]>(
    organizerId && appId ? apiUrl : null,
    expressFetcher,
    {
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      revalidateOnFocus: false
    }
  );

  const timeRange = useMemo(() => {
    if (!matches) return { minTime: "00:00:00", maxTime: "24:00:00" };
    return findMinMaxTimes(matches);
  }, [matches]);

  const handleEventClick = (info: EventClickArg) => {
    const matchId = info.event.extendedProps?.matchId;
    if (matchId) {
      // Open match in new tab in parent window
      const matchUrl = `${window.location.origin}/matches/${matchId}`;
      window.open(matchUrl, "_blank", "noopener,noreferrer");
    }
  };

  const calendarOptions = useMemo(
    () => ({
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: view,
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek"
      },
      events: matches ? transformMatchesToEvents(matches) : [],
      eventClick: handleEventClick,
      eventContent: (arg: EventContentArg) => {
        const startTime = formatInTimezone(arg.event.startStr, "p");
        const hasStream = arg.event.extendedProps?.hasStream;

        return (
          <div className="px-1 py-0.5 text-xs overflow-hidden">
            <div className="font-semibold truncate leading-tight">
              {arg.event.title}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Clock className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="text-[10px] font-medium truncate">
                {startTime}
              </span>
              {hasStream && (
                <span className="text-[10px] text-amber-400">●</span>
              )}
            </div>
            <div className="text-[10px] font-medium truncate leading-tight">
              {arg.event.extendedProps?.league}
            </div>
          </div>
        );
      },
      dayMaxEvents: height ? 2 : 3,
      moreLinkClick: "popover",
      moreLinkContent: (arg: MoreLinkContentArg) => `+${arg.num} more`,
      slotMinTime: timeRange.minTime,
      slotMaxTime: timeRange.maxTime,
      allDaySlot: false,
      height: height || "auto",
      eventMaxStack: height ? 2 : 3,
      slotEventOverlap: true,
      selectable: false,
      selectMirror: false,
      weekends: true,
      firstDay: 1,
      nowIndicator: true,
      eventDisplay: "block",
      eventTimeFormat: {
        hour: "2-digit" as const,
        minute: "2-digit" as const,
        hour12: false
      },
      eventOrder: "displayOrder,start,-allDay",
      editable: false,
      dayMaxEventRows: 3
    }),
    [view, matches, timeRange.minTime, timeRange.maxTime, height]
  );

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(theme);
  }, [theme]);

  // Keep FullCalendar "more" popover inside the calendar container (see clampFullCalendarMorePopover)
  useEffect(() => {
    if (isLoading || !organizerId || !appId) return;

    const root = embedContainerRef.current;
    if (!root) return;

    const scheduleClamp = (popover: HTMLElement) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          clampFullCalendarMorePopover(popover, root);
        });
      });
    };

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          const popover = node.matches(".fc-more-popover")
            ? node
            : node.querySelector(".fc-more-popover");
          if (popover instanceof HTMLElement) {
            scheduleClamp(popover);
          }
        }
      }
    });

    observer.observe(root, { childList: true, subtree: true });

    const resetPopoverLayoutStyles = (popover: HTMLElement) => {
      popover.style.maxHeight = "";
      popover.style.maxWidth = "";
      popover.style.boxSizing = "";
      popover.style.display = "";
      popover.style.flexDirection = "";
      popover.style.minHeight = "";
      const body = popover.querySelector(".fc-popover-body");
      if (body instanceof HTMLElement) {
        body.style.removeProperty("max-height");
        body.style.overflowY = "";
        body.style.minHeight = "";
        body.style.flex = "";
      }
    };

    const onResize = () => {
      const popover = root.querySelector(".fc-more-popover");
      if (!(popover instanceof HTMLElement)) return;
      resetPopoverLayoutStyles(popover);
      requestAnimationFrame(() => {
        clampFullCalendarMorePopover(popover, root);
      });
    };

    window.addEventListener("resize", onResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [isLoading, organizerId, appId]);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center bg-background"
        style={{ height, width }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (!organizerId || !appId) {
    return (
      <div
        className="flex items-center justify-center bg-background text-foreground"
        style={{ height, width }}
      >
        <div className="text-center p-4">
          <p className="text-sm text-red-500 mb-2">
            Missing required parameters
          </p>
          <p className="text-xs text-muted-foreground">
            Please provide organizer_id and app_id query parameters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={embedContainerRef}
      className={`embed-calendar-container bg-background text-foreground ${theme}`}
      style={{ height, width }}
    >
      <style>{`
        .embed-calendar-container .fc {
          font-family: inherit;
        }
        .embed-calendar-container .fc-theme-standard td,
        .embed-calendar-container .fc-theme-standard th {
          border-color: var(--border, #333);
        }
        .embed-calendar-container .fc-theme-standard .fc-scrollgrid {
          border-color: var(--border, #333);
        }
        .embed-calendar-container .fc .fc-button {
          background: var(--primary, #3b82f6);
          border: none;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
        }
        .embed-calendar-container .fc .fc-button:hover {
          background: var(--primary-hover, #2563eb);
        }
        .embed-calendar-container .fc .fc-button-active {
          background: var(--primary-active, #1d4ed8) !important;
        }
        .embed-calendar-container .fc-daygrid-day-number,
        .embed-calendar-container .fc-col-header-cell-cushion {
          color: var(--foreground, #fff);
        }
        .embed-calendar-container .fc-event {
          cursor: pointer;
          transition: transform 0.1s ease;
        }
        .embed-calendar-container .fc-event:hover {
          transform: scale(1.02);
        }
        .embed-calendar-container .stream-match {
          border-width: 2px !important;
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
        }
        /* Override globals.css min-width:600px so popover can shrink inside narrow embeds */
        .embed-calendar-container .fc-theme-standard .fc-popover,
        .embed-calendar-container .fc-popover.fc-more-popover {
          min-width: 0 !important;
          box-sizing: border-box;
        }
        .embed-calendar-container .fc-popover-body {
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)) !important;
        }
        /* Let JS + flex parent set height; globals use max-height:400px which fights expansion */
        .embed-calendar-container .fc-theme-standard .fc-popover-body {
          max-height: none !important;
        }
        .embed-calendar-container .fc-more-popover .fc-popover-header {
          flex-shrink: 0;
        }
        .embed-calendar-container.dark {
          --background: #09090b;
          --foreground: #fafafa;
          --border: #27272a;
          --muted-foreground: #a1a1aa;
          --primary: #f97316;
          --primary-hover: #ea580c;
          --primary-active: #c2410c;
        }
        .embed-calendar-container.light {
          --background: #ffffff;
          --foreground: #09090b;
          --border: #e4e4e7;
          --muted-foreground: #71717a;
          --primary: #f97316;
          --primary-hover: #ea580c;
          --primary-active: #c2410c;
        }
      `}</style>
      <FullCalendar ref={calendarRef} {...calendarOptions} />
    </div>
  );
}
