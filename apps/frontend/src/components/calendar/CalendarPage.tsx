"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  EventClickArg,
  EventContentArg,
  MoreLinkContentArg,
  MoreLinkMountArg
} from "@fullcalendar/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  ExternalLink,
  Calendar,
  Clock,
  List,
  Grid3X3,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { useSeasonLeagues } from "@/hooks/data/useSeasonLeagues";
import type { MatchWithStreamUrls } from "@eggosystem/types";
import { useSeasonCalendarMatches } from "@/hooks/data/useSeasonCalendarMatches";

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

interface EventDetails {
  id: string;
  title: string;
  start: string;
  end: string;
  league: string;
  streamUrl?: string[];
  team1: string;
  team2: string;
}

const transformMatchesToEvents = (matches: MatchWithStreamUrls[]) => {
  return matches.map((match) => ({
    id: match.match_id,
    title: match.title,
    start: match.match_start,
    end: match.match_end,
    backgroundColor: DIVISIONS[match.league_tier]?.color || "#6b7280", // fallback to gray
    borderColor: DIVISIONS[match.league_tier]?.borderColor || "#4b5563", // fallback to darker gray
    extendedProps: {
      league: match.league_name,
      streamUrl: match.streamUrl,
      team1: match.match_team1,
      team2: match.match_team2,
      tier: match.league_tier
    }
  }));
};

export default function CalendarPage({ seasonId }: { seasonId: string }) {
  const _seasonToFetch = seasonId;
  const [view, setView] = useState<"dayGridMonth" | "timeGridWeek">(
    "dayGridMonth"
  );
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<number | "all">(
    "all"
  );
  const calendarRef = useRef<FullCalendar>(null);
  const { seasonLeagues, isLoading: isLoadingSeasonLeagues } =
    useSeasonLeagues(seasonId);

  const { calendarMatches, isLoading: _isLoadingCalendarMatches } =
    useSeasonCalendarMatches(seasonId, selectedDivision);

  // Change view when view state changes
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(view);
    }
  }, [view]);

  const calendarOptions = useMemo(
    () => ({
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: view,
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: ""
      },
      events: calendarMatches ? transformMatchesToEvents(calendarMatches) : [],
      eventClick: (info: EventClickArg) => {
        const event = info.event;
        setSelectedEvent({
          id: event.id,
          title: event.title,
          start: event.startStr,
          end: event.endStr,
          league: event.extendedProps?.league || "",
          streamUrl: event.extendedProps?.streamUrl,
          team1: event.extendedProps?.team1 || "",
          team2: event.extendedProps?.team2 || ""
        } satisfies EventDetails);
        setIsDialogOpen(true);
      },
      eventContent: (arg: EventContentArg) => {
        return (
          <div className="p-1 text-xs">
            <div className="font-semibold truncate">{arg.event.title}</div>

            <div className="text-xs font-medium mt-0.5">
              {arg.event.extendedProps?.league}
            </div>
          </div>
        );
      },
      dayMaxEvents: 3, // Show max 3 events per day, rest will be shown as "+more"
      moreLinkClick: "popover", // Show remaining events in a popover
      moreLinkContent: (arg: MoreLinkContentArg) => {
        return `+${arg.num} more`;
      },
      moreLinkDidMount: (_info: MoreLinkMountArg) => {
        // This callback runs when the "more" link is mounted
        // We can use it to fix popover colors if needed
      },
      didMount: () => {
        // Add event listener for popover events to ensure colors are applied
        document.addEventListener("click", (e) => {
          const moreLink = e.target as HTMLElement;
          if (moreLink && moreLink.classList.contains("fc-more-link")) {
            // Wait for popover to be created
            setTimeout(() => {
              const popover = document.querySelector(".fc-more-popover");
              if (popover) {
                const events = popover.querySelectorAll(".fc-event");
                events.forEach((eventEl: Element) => {
                  const htmlEventEl = eventEl as HTMLElement;
                  // Check if the event has a style attribute with background-color
                  if (htmlEventEl.style.backgroundColor) {
                    // Force the background color to show
                    htmlEventEl.style.setProperty(
                      "background-color",
                      htmlEventEl.style.backgroundColor,
                      "important"
                    );
                  }
                });
              }
            }, 50);
          }
        });
      },
      slotMinTime: "14:00:00", // Start at 2 PM
      slotMaxTime: "24:00:00", // End at midnight
      allDaySlot: false,
      slotDuration: "00:30:00",
      expandRows: true, // Ensure rows expand to fill available space
      height: "auto",
      selectable: true,
      selectMirror: true,
      weekends: true,
      firstDay: 1, // Start week on Monday
      nowIndicator: true, // Show current time indicator
      eventDisplay: "block", // Ensure events are displayed as blocks
      eventTimeFormat: {
        hour: "2-digit" as const,
        minute: "2-digit" as const,
        hour12: false
      },
      // Mobile-specific options
      handleWindowResize: true, // Handle window resize for responsive behavior
      windowResizeDelay: 100, // Delay for resize handling
      // Touch-friendly interactions
      longPressDelay: 500, // Longer delay for mobile long press
      eventLongPressDelay: 500, // Delay for event long press
      selectLongPressDelay: 500, // Delay for selection long press
      // Mobile viewport handling
      aspectRatio: 1.35, // Better aspect ratio for mobile
      // Mobile event display
      dayMaxEventRows: 2, // Limit event rows on mobile
      // Mobile popover positioning
      popoverParent: document.body // Ensure popover is positioned relative to body
    }),
    [view, calendarMatches]
  );

  const handleViewChange = (newView: "dayGridMonth" | "timeGridWeek") => {
    setView(newView);
  };

  const handleStreamClick = (url?: string) => {
    if (url) {
      window.open(url, "_blank");
    } else if (
      selectedEvent?.streamUrl &&
      selectedEvent.streamUrl.length === 1
    ) {
      window.open(selectedEvent.streamUrl[0], "_blank");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Match Calendar</h1>
        <p className="text-muted-foreground">
          View and manage upcoming matches and events
        </p>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Calendar</span>
                <div className="flex gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <Select
                      value={selectedDivision.toString()}
                      onValueChange={(value) =>
                        setSelectedDivision(parseInt(value, 10))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Division" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Divisions</SelectItem>
                        {isLoadingSeasonLeagues ? (
                          <SelectItem value="loading">Loading...</SelectItem>
                        ) : (
                          seasonLeagues?.map((league) => (
                            <SelectItem
                              key={league.id}
                              value={league.id.toString()}
                            >
                              {league.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={view === "dayGridMonth" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleViewChange("dayGridMonth")}
                    >
                      Month
                    </Button>
                    <Button
                      variant={view === "timeGridWeek" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleViewChange("timeGridWeek")}
                    >
                      Week
                    </Button>
                  </div>
                </div>
              </CardTitle>
              {/* Division Legend */}
              <div className="flex flex-wrap gap-2 mt-4">
                {seasonLeagues?.map((league) => (
                  <div key={league.id} className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: DIVISIONS[league.tier]?.color
                      }}
                    ></div>
                    <span className="text-xs">{league.name}</span>
                  </div>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="calendar-container">
                <FullCalendar ref={calendarRef} {...calendarOptions} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Upcoming Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {calendarMatches?.map((match) => (
                  <div
                    key={match.match_id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer gap-3"
                    onClick={() => {
                      setSelectedEvent({
                        id: match.match_id,
                        title: match.title,
                        start: match.match_start,
                        end: match.match_end,
                        league: match.league_name,
                        streamUrl: match.streamUrl,
                        team1: match.match_team1,
                        team2: match.match_team2
                      });
                      setIsDialogOpen(true);
                    }}
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                        style={{
                          backgroundColor: DIVISIONS[match.league_tier]?.color
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {match.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(match.match_start), "PPP 'at' p")} -{" "}
                          {format(new Date(match.match_end), "p")}
                        </p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {match.league_name}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 w-full sm:w-auto"
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Event Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Match Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about the selected match
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(selectedEvent.start), "PPP 'at' p")} -{" "}
                    {selectedEvent.end
                      ? format(new Date(selectedEvent.end), "p")
                      : "TBA"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedEvent.league}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-2">
                {/* Stream Section */}
                {selectedEvent.streamUrl &&
                  selectedEvent.streamUrl.length > 0 && (
                    <>
                      {selectedEvent.streamUrl.length === 1 ? (
                        // Single stream - show as button
                        <Button
                          onClick={() => handleStreamClick()}
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Watch Stream
                        </Button>
                      ) : (
                        // Multiple streams - show as links
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">
                            Available Streams:
                          </h4>
                          <div className="flex flex-col gap-1">
                            {selectedEvent.streamUrl.map((url, index) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Stream {index + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                {/* View Match Details button - always available */}
                <Button variant="outline" className="w-full">
                  View Match Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
