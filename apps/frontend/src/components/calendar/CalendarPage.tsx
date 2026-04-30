"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  EventApi,
  EventClickArg,
  EventContentArg,
  MoreLinkContentArg,
  MoreLinkHandler
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
  ExternalLink,
  Calendar,
  Clock,
  List,
  Grid3X3,
  Filter
} from "lucide-react";
import { formatInTimezone } from "@/lib/timezone";
import { useSeasonLeagues } from "@/hooks/data/useSeasonLeagues";
import { MatchStatus, type MatchWithStreamUrls } from "@eggosystem/types";
import { useSeasonCalendarMatches } from "@/hooks/data/useSeasonCalendarMatches";
import { useCalendarRefreshTimes } from "@/hooks/data/useCalendarRefreshTimes";
import {
  sortMatchesByDateAndTier,
  DIVISIONS,
  findMinMaxTimes
} from "@/lib/calendar-utils";
import { LeagueSelector } from "@/components/league/LeagueSelector";
import { TierDot } from "@/components/kanaliiga";
import { StreamReservation } from "./StreamReservation";
import {
  CalendarMoreEventsDialog,
  useCalendarMoreLinkDialog
} from "./CalendarMoreEventsDialog";
import Link from "next/link";
import { createNextUrl } from "@/lib/utils";
import {
  calendarMatchHomeLeftTeamNames,
  calendarMatchVersusTitle
} from "@/lib/order-match-teams-home-left-away";

interface EventDetails {
  id: string;
  title: string;
  start: string;
  end: string;
  league: string;
  streamUrl?: string[];
  team1: string;
  team2: string;
  status: string;
}

function createEventDetails(
  id: string,
  title: string,
  start: string,
  end: string,
  league: string,
  streamUrl?: string[],
  team1?: string,
  team2?: string,
  status?: string
): EventDetails {
  return {
    id,
    title,
    start,
    end,
    league,
    streamUrl,
    team1: team1 || "",
    team2: team2 || "",
    status: status || ""
  };
}

function eventDetailsFromApi(event: EventApi): EventDetails {
  return createEventDetails(
    event.id,
    event.title,
    event.startStr,
    event.endStr,
    event.extendedProps?.league || "",
    event.extendedProps?.streamUrl,
    event.extendedProps?.team1,
    event.extendedProps?.team2,
    event.extendedProps?.status || ""
  );
}

const RenderStreamLinks = ({ streamUrl }: { streamUrl?: string[] }) => {
  if (!streamUrl || streamUrl.length === 0) {
    return null;
  }

  const firstStreamUrl = streamUrl[0];
  if (firstStreamUrl) {
    return (
      <Button variant="outline" asChild>
        <Link
          href={firstStreamUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 kanaliiga-link"
        >
          <ExternalLink className="h-4 w-4" />
          Watch Stream
        </Link>
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Available Streams:</h4>
      <div className="flex flex-col gap-1">
        {streamUrl.map((url, index) => (
          <Link
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm kanaliiga-link"
          >
            <ExternalLink className="h-3 w-3" />
            {url}
          </Link>
        ))}
      </div>
    </div>
  );
};

const RenderStreamButton = ({
  matchId,
  onReservationChange,
  status
}: {
  matchId: string;
  onReservationChange: () => Promise<void>;
  status: string;
}) => {
  if (status === MatchStatus.SCHEDULED) {
    return (
      <StreamReservation
        matchId={matchId}
        onReservationChange={onReservationChange}
      />
    );
  }

  return null;
};

const transformMatchesToEvents = (matches: MatchWithStreamUrls[]) => {
  // Sort matches by date/time first, then by tier
  const sortedMatches = sortMatchesByDateAndTier(matches);

  return sortedMatches.map((match, index) => {
    const hasStream = match.stream_urls && match.stream_urls.length > 0;
    const { leftName, rightName } = calendarMatchHomeLeftTeamNames(match);

    return {
      id: match.match_id,
      title: calendarMatchVersusTitle(match),
      start: match.match_start,
      end: match.match_end,
      backgroundColor: DIVISIONS[match.league_tier]?.color || "#6b7280", // fallback to gray
      borderColor: hasStream
        ? "#f59e0b" // amber-500 for matches with streams
        : DIVISIONS[match.league_tier]?.borderColor || "#4b5563", // fallback to darker gray
      // Add displayOrder to ensure proper sorting in popovers
      displayOrder: index,
      // Add special styling for streamed matches
      classNames: hasStream ? "stream-match" : "",
      extendedProps: {
        league: match.league_name,
        streamUrl: match.stream_urls,
        team1: leftName,
        team2: rightName,
        tier: match.league_tier,
        hasStream: hasStream,
        status: match.match_status,
        // Store the original sort order for popover sorting
        sortOrder: index
      }
    };
  });
};

export default function CalendarPage({ seasonId }: { seasonId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL parameters
  const [view, setView] = useState<"dayGridMonth" | "timeGridWeek">(() => {
    const urlView = searchParams.get("view");
    return urlView === "week" ? "timeGridWeek" : "dayGridMonth";
  });

  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [selectedDivision, setSelectedDivision] = useState<number | "all">(
    () => {
      const urlDivision = searchParams.get("division");
      if (urlDivision === "all" || !urlDivision) return "all";
      const parsedDivision = parseInt(urlDivision, 10);
      return isNaN(parsedDivision) ? "all" : parsedDivision;
    }
  );

  const calendarRef = useRef<FullCalendar>(null);
  const moreDialog = useCalendarMoreLinkDialog();
  const { seasonLeagues } = useSeasonLeagues(seasonId);

  const {
    data: calendarMatches,
    isLoading: _isLoadingCalendarMatches,
    mutate: mutateCalendarMatches
  } = useSeasonCalendarMatches(seasonId, selectedDivision);

  const { refreshTimes, isLoading: isLoadingRefreshTimes } =
    useCalendarRefreshTimes();

  const getMatchButtonText = (matchStatus: string): string => {
    const isUpcoming = matchStatus === MatchStatus.SCHEDULED;
    return isUpcoming ? "View Upcoming Match" : "View Match Details";
  };

  const handleEventSelect = useCallback((eventDetails: EventDetails) => {
    setSelectedEvent(eventDetails);
    setIsDialogOpen(true);
  }, []);

  // Update URL parameters without page reload
  const updateUrlParams = (
    newView?: "dayGridMonth" | "timeGridWeek",
    newDivision?: number | "all"
  ) => {
    const params = new URLSearchParams(searchParams);

    if (newView !== undefined) {
      params.set("view", newView === "timeGridWeek" ? "week" : "month");
    }

    if (newDivision !== undefined) {
      params.set("division", newDivision.toString());
    }

    // Use replace to avoid adding to browser history for every filter change
    router.replace(`?${params.toString()}`);
  };

  // Calculate dynamic time range based on matches
  const timeRange = useMemo(() => {
    if (!calendarMatches) return { minTime: "00:00:00", maxTime: "24:00:00" };
    return findMinMaxTimes(calendarMatches);
  }, [calendarMatches]);

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
        handleEventSelect(eventDetailsFromApi(info.event));
      },
      eventContent: (arg: EventContentArg) => {
        const startTime = formatInTimezone(arg.event.startStr, "p");
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
            </div>
            <div className="text-[10px] font-medium truncate leading-tight">
              {arg.event.extendedProps?.league}
            </div>
          </div>
        );
      },
      dayMaxEvents: 2, // Reduced from 3 for mobile
      moreLinkClick:
        moreDialog.moreLinkClickForFullCalendar as unknown as MoreLinkHandler,
      moreLinkContent: (arg: MoreLinkContentArg) => {
        return `+${arg.num} more`;
      },
      slotMinTime: timeRange.minTime,
      slotMaxTime: timeRange.maxTime,
      allDaySlot: false,
      slotDuration: "00:30:00",
      expandRows: true, // Ensure rows expand to fill available space
      height: "auto",
      eventMaxStack: 2, // Reduced from 3 for mobile
      slotEventOverlap: false, // Prevent events from overlapping in time slots
      selectable: false, // Disable date/time selection
      selectMirror: false, // Disable selection mirror
      weekends: true,
      firstDay: 1, // Start week on Monday
      nowIndicator: true, // Show current time indicator
      eventDisplay: "block", // Ensure events are displayed as blocks
      eventTimeFormat: {
        hour: "2-digit" as const,
        minute: "2-digit" as const,
        hour12: false
      },
      // Custom event ordering to ensure proper sorting in popovers
      eventOrder: "displayOrder,start,-allDay",
      // Disable calendar interactions
      editable: false, // Disable event editing
      droppable: false, // Disable drag and drop
      eventResizableFromStart: false, // Disable event resizing
      // Mobile-specific options
      handleWindowResize: true, // Handle window resize for responsive behavior
      windowResizeDelay: 100, // Delay for resize handling
      // Touch-friendly interactions
      longPressDelay: 500, // Longer delay for mobile long press
      eventLongPressDelay: 500, // Delay for event long press
      selectLongPressDelay: 500, // Delay for selection long press
      // Mobile event display
      dayMaxEventRows: 2 // Limit event rows on mobile
    }),
    [
      view,
      calendarMatches,
      timeRange.minTime,
      timeRange.maxTime,
      moreDialog.moreLinkClickForFullCalendar,
      handleEventSelect
    ]
  );

  const handleViewChange = (newView: "dayGridMonth" | "timeGridWeek") => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      // Preserve the current date when switching views
      const currentDate = calendarApi.getDate();
      calendarApi.changeView(newView, currentDate);
    }
    setView(newView);
    updateUrlParams(newView, undefined);
  };

  const handleDivisionChange = (value: string) => {
    const newDivision = value === "all" ? "all" : parseInt(value, 10);
    setSelectedDivision(newDivision);
    updateUrlParams(undefined, newDivision);
  };

  const handleStreamReservation = async () => {
    // Refresh calendar data to show the new stream
    await mutateCalendarMatches();
    setIsDialogOpen(false);
  };

  return (
    <div className="mx-auto py-4 sm:py-8 px-2 sm:px-4">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-2">
          Match Calendar
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          View and manage upcoming matches and events
        </p>

        {/* Calendar Refresh Information */}
        {refreshTimes && !isLoadingRefreshTimes && (
          <div className="mt-3 text-xs text-muted-foreground">
            <span>
              Calendar refreshes every 3 hours • Next refresh in{" "}
              {refreshTimes.timeUntilNextRefresh}
            </span>
          </div>
        )}
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
          <TabsTrigger
            value="calendar"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Calendar View</span>
            <span className="sm:hidden">Calendar</span>
          </TabsTrigger>
          <TabsTrigger
            value="list"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <List className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">List View</span>
            <span className="sm:hidden">List</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4 sm:mt-6">
          <div className="space-y-4">
            {/* Calendar Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <span className="text-lg sm:text-xl font-semibold">Calendar</span>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <LeagueSelector
                    value={selectedDivision.toString()}
                    onValueChange={handleDivisionChange}
                    placeholder="Division"
                    triggerClassName="w-full sm:min-w-48"
                    leagues={[
                      { id: "all", name: "All Divisions" },
                      ...(seasonLeagues?.map((l) => ({
                        id: String(l.id),
                        name: l.name,
                        tier: l.tier
                      })) ?? [])
                    ]}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={view === "dayGridMonth" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleViewChange("dayGridMonth")}
                    className="flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    Month
                  </Button>
                  <Button
                    variant={view === "timeGridWeek" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleViewChange("timeGridWeek")}
                    className="flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    Week
                  </Button>
                </div>
              </div>
            </div>

            {/* Division Legend */}
            <div className="flex flex-wrap gap-2">
              {seasonLeagues?.map((league) => (
                <div key={league.id} className="flex items-center gap-1">
                  <TierDot tier={league.tier} />
                  <span className="text-xs">{league.name}</span>
                </div>
              ))}
            </div>

            {/* Calendar */}
            <div className="calendar-container">
              <FullCalendar ref={calendarRef} {...calendarOptions} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-lg sm:text-xl">Upcoming Matches</span>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <LeagueSelector
                    value={selectedDivision.toString()}
                    onValueChange={handleDivisionChange}
                    placeholder="Division"
                    triggerClassName="w-full sm:min-w-48"
                    leagues={[
                      { id: "all", name: "All Divisions" },
                      ...(seasonLeagues?.map((l) => ({
                        id: String(l.id),
                        name: l.name,
                        tier: l.tier
                      })) ?? [])
                    ]}
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 sm:pt-6">
              <div className="space-y-3 sm:space-y-4">
                {sortMatchesByDateAndTier(calendarMatches || [])
                  .filter(
                    (match) => match.match_status === MatchStatus.SCHEDULED
                  )
                  .map((match) => {
                    const { leftName, rightName } =
                      calendarMatchHomeLeftTeamNames(match);
                    return (
                      <div
                        key={match.match_id}
                        className="flex flex-col gap-3 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => {
                          handleEventSelect(
                            createEventDetails(
                              match.match_id,
                              calendarMatchVersusTitle(match),
                              match.match_start,
                              match.match_end,
                              match.league_name,
                              match.stream_urls,
                              leftName,
                              rightName,
                              match.match_status
                            )
                          );
                        }}
                      >
                        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                          <div
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 mt-1"
                            style={{
                              backgroundColor:
                                DIVISIONS[match.league_tier]?.color
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold break-words text-sm sm:text-base">
                              {calendarMatchVersusTitle(match)}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                              {formatInTimezone(
                                match.match_start,
                                "PPP 'at' p"
                              )}{" "}
                              - {formatInTimezone(match.match_end, "p")}
                            </p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              <Badge variant="secondary" className="text-xs">
                                {match.league_name}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CalendarMoreEventsDialog
        open={moreDialog.open}
        onOpenChange={moreDialog.onOpenChange}
        title={moreDialog.title}
        segments={moreDialog.segments}
        onEventSelect={(ev) => handleEventSelect(eventDetailsFromApi(ev))}
      />

      {/* Event Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-base sm:text-lg">Match Details</span>
            </DialogTitle>
            <DialogDescription className="text-sm">
              Detailed information about the selected match
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <h3 className="font-semibold text-base sm:text-lg">
                {selectedEvent.title}
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">
                    {formatInTimezone(selectedEvent.start, "PPP 'at' p")} -{" "}
                    {selectedEvent.end
                      ? formatInTimezone(selectedEvent.end, "p")
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
                <RenderStreamButton
                  matchId={selectedEvent.id}
                  onReservationChange={handleStreamReservation}
                  status={selectedEvent.status}
                />
                <RenderStreamLinks streamUrl={selectedEvent.streamUrl} />
                <Button variant="outline" className="w-full" asChild>
                  <Link
                    href={createNextUrl(`/matches/${selectedEvent.id}`)}
                    target="_blank"
                  >
                    {getMatchButtonText(selectedEvent.status)}
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
