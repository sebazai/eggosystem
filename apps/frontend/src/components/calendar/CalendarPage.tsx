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
  MapPin,
  List,
  Grid3X3,
  Filter
} from "lucide-react";
import { format } from "date-fns";

// Division definitions with darker, more readable colors
const DIVISIONS = {
  Masters: { color: "#b91c1c", borderColor: "#991b1b" }, // Darker red
  Challengers: { color: "#1d4ed8", borderColor: "#1e40af" }, // Darker blue
  Prospects: { color: "#047857", borderColor: "#065f46" }, // Darker green
  Div4: { color: "#b45309", borderColor: "#92400e" }, // Darker orange
  Div5: { color: "#6d28d9", borderColor: "#5b21b6" }, // Darker purple
  Div6: { color: "#be185d", borderColor: "#9d174d" }, // Darker pink
  Div7: { color: "#0e7490", borderColor: "#155e75" }, // Darker cyan
  Div8: { color: "#4d7c0f", borderColor: "#365314" }, // Darker lime
  Div9: { color: "#c2410c", borderColor: "#9a3412" }, // Darker red-orange
  Div10: { color: "#7c3aed", borderColor: "#6d28d9" }, // Darker violet
  Div11: { color: "#0f766e", borderColor: "#134e4a" }, // Darker teal
  Div12: { color: "#a16207", borderColor: "#854d0e" } // Darker yellow
} as const;

type DivisionName = keyof typeof DIVISIONS;

// Helper function to get division colors
const _getDivisionColors = (division: DivisionName) => DIVISIONS[division];

// Enhanced mock data with more examples and stream links - Updated for July 2025
const rawMockEvents = [
  {
    id: "1",
    title: "Team Alpha vs Team Beta",
    start: "2025-07-22T19:00:00",
    end: "2025-07-22T21:00:00",
    extendedProps: {
      type: "match",
      league: "Masters",
      map: "de_dust2",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team Alpha",
      team2: "Team Beta",
      description: "Quarter-final match in Masters playoffs"
    }
  },
  {
    id: "2",
    title: "Team Gamma vs Team Delta",
    start: "2025-07-23T20:00:00",
    end: "2025-07-23T22:00:00",

    extendedProps: {
      type: "match",
      league: "Masters",
      map: "de_mirage",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team Gamma",
      team2: "Team Delta",
      description: "Semi-final match in Masters playoffs"
    }
  },
  {
    id: "3",
    title: "Team Epsilon vs Team Zeta",
    start: "2025-07-24T19:30:00",
    end: "2025-07-24T21:30:00",

    extendedProps: {
      type: "match",
      league: "Masters",
      map: "de_inferno",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team Epsilon",
      team2: "Team Zeta",
      description: "Grand final match in Masters playoffs"
    }
  },
  {
    id: "4",
    title: "Team Eta vs Team Theta",
    start: "2025-07-25T18:00:00",
    end: "2025-07-25T20:00:00",

    extendedProps: {
      type: "match",
      league: "Masters",
      map: "de_overpass",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team Eta",
      team2: "Team Theta",
      description: "Third place match in Masters playoffs"
    }
  },
  {
    id: "5",
    title: "Team Iota vs Team Kappa",
    start: "2025-07-26T20:30:00",
    end: "2025-07-26T22:30:00",

    extendedProps: {
      type: "match",
      league: "Masters",
      map: "de_ancient",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team Iota",
      team2: "Team Kappa",
      description: "Exhibition match"
    }
  },
  // Additional examples for different dates
  {
    id: "6",
    title: "Team Lambda vs Team Mu",
    start: "2025-07-27T19:00:00",
    end: "2025-07-27T21:00:00",

    extendedProps: {
      type: "match",
      league: "Masters",
      map: "de_vertigo",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team Lambda",
      team2: "Team Mu",
      description: "Regular season match"
    }
  },
  {
    id: "7",
    title: "Team Nu vs Team Xi",
    start: "2025-07-28T20:00:00",
    end: "2025-07-28T22:00:00",

    extendedProps: {
      type: "match",
      league: "Masters",
      map: "de_nuke",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team Nu",
      team2: "Team Xi",
      description: "Regular season match"
    }
  },
  {
    id: "8",
    title: "Team Omicron vs Team Pi",
    start: "2025-07-29T19:30:00",
    end: "2025-07-29T21:30:00",

    extendedProps: {
      type: "match",
      league: "Masters",
      map: "de_cache",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team Omicron",
      team2: "Team Pi",
      description: "Regular season match"
    }
  },
  // Multiple events on same day to test overflow
  {
    id: "9",
    title: "Team Rho vs Team Sigma",
    start: "2025-07-30T18:00:00",
    end: "2025-07-30T20:00:00",

    extendedProps: {
      type: "match",
      league: "Masters",
      map: "de_train",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team Rho",
      team2: "Team Sigma",
      description: "Regular season match"
    }
  },
  {
    id: "10",
    title: "Team Tau vs Team Upsilon",
    start: "2025-07-30T20:30:00",
    end: "2025-07-30T22:30:00",

    extendedProps: {
      type: "match",
      league: "Masters",
      map: "de_cobblestone",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team Tau",
      team2: "Team Upsilon",
      description: "Regular season match"
    }
  },
  {
    id: "11",
    title: "Team Phi vs Team Chi",
    start: "2025-07-30T23:00:00",
    end: "2025-07-31T01:00:00",

    extendedProps: {
      type: "match",
      league: "Masters",
      map: "de_dust2",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team Phi",
      team2: "Team Chi",
      description: "Regular season match"
    }
  },
  // More events for testing
  {
    id: "12",
    title: "Team Psi vs Team Omega",
    start: "2025-07-31T19:00:00",
    end: "2025-07-31T21:00:00",

    extendedProps: {
      type: "match",
      league: "Masters",
      map: "de_mirage",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team Psi",
      team2: "Team Omega",
      description: "Regular season match"
    }
  },
  {
    id: "13",
    title: "Team Alpha vs Team Gamma",
    start: "2025-08-01T20:00:00",
    end: "2025-08-01T22:00:00",

    extendedProps: {
      type: "match",
      league: "Masters",
      map: "de_inferno",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team Alpha",
      team2: "Team Gamma",
      description: "Regular season match"
    }
  },
  {
    id: "14",
    title: "Team Beta vs Team Delta",
    start: "2025-08-02T19:30:00",
    end: "2025-08-02T21:30:00",

    extendedProps: {
      type: "match",
      league: "Masters",
      map: "de_overpass",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team Beta",
      team2: "Team Delta",
      description: "Regular season match"
    }
  },
  // Adding 20+ events to July 30th to test overflow handling
  {
    id: "15",
    title: "Team A1 vs Team B1",
    start: "2025-07-30T18:00:00",
    end: "2025-07-30T20:00:00",

    extendedProps: {
      type: "match",
      league: "Challengers",
      map: "de_dust2",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team A1",
      team2: "Team B1",
      description: "Evening match"
    }
  },
  {
    id: "16",
    title: "Team C1 vs Team D1",
    start: "2025-07-30T20:30:00",
    end: "2025-07-30T22:30:00",

    extendedProps: {
      type: "match",
      league: "Challengers",
      map: "de_mirage",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team C1",
      team2: "Team D1",
      description: "Night match"
    }
  },
  {
    id: "17",
    title: "Team E1 vs Team F1",
    start: "2025-07-30T19:00:00",
    end: "2025-07-30T21:00:00",

    extendedProps: {
      type: "match",
      league: "Challengers",
      map: "de_inferno",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team E1",
      team2: "Team F1",
      description: "Evening match"
    }
  },
  {
    id: "18",
    title: "Team G1 vs Team H1",
    start: "2025-07-30T15:30:00",
    end: "2025-07-30T17:30:00",

    extendedProps: {
      type: "match",
      league: "Challengers",
      map: "de_overpass",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team G1",
      team2: "Team H1",
      description: "Late afternoon match"
    }
  },
  {
    id: "19",
    title: "Team I1 vs Team J1",
    start: "2025-07-30T18:00:00",
    end: "2025-07-30T20:00:00",

    extendedProps: {
      type: "match",
      league: "Challengers",
      map: "de_ancient",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team I1",
      team2: "Team J1",
      description: "Evening match"
    }
  },
  {
    id: "20",
    title: "Team K1 vs Team L1",
    start: "2025-07-30T20:30:00",
    end: "2025-07-30T22:30:00",

    extendedProps: {
      type: "match",
      league: "Challengers",
      map: "de_vertigo",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team K1",
      team2: "Team L1",
      description: "Night match"
    }
  },
  {
    id: "21",
    title: "Team M1 vs Team N1",
    start: "2025-07-30T23:00:00",
    end: "2025-07-31T01:00:00",

    extendedProps: {
      type: "match",
      league: "Challengers",
      map: "de_nuke",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team M1",
      team2: "Team N1",
      description: "Late night match"
    }
  },
  {
    id: "22",
    title: "Team O1 vs Team P1",
    start: "2025-07-30T18:30:00",
    end: "2025-07-30T20:30:00",

    extendedProps: {
      type: "match",
      league: "Prospects",
      map: "de_cache",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team O1",
      team2: "Team P1",
      description: "Evening match"
    }
  },
  {
    id: "23",
    title: "Team Q1 vs Team R1",
    start: "2025-07-30T21:00:00",
    end: "2025-07-30T23:00:00",

    extendedProps: {
      type: "match",
      league: "Prospects",
      map: "de_train",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team Q1",
      team2: "Team R1",
      description: "Night match"
    }
  },
  {
    id: "24",
    title: "Team S1 vs Team T1",
    start: "2025-07-30T19:30:00",
    end: "2025-07-30T21:30:00",

    extendedProps: {
      type: "match",
      league: "Prospects",
      map: "de_cobblestone",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team S1",
      team2: "Team T1",
      description: "Evening match"
    }
  },
  {
    id: "25",
    title: "Team U1 vs Team V1",
    start: "2025-07-30T16:00:00",
    end: "2025-07-30T18:00:00",

    extendedProps: {
      type: "match",
      league: "Prospects",
      map: "de_dust2",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team U1",
      team2: "Team V1",
      description: "Late afternoon match"
    }
  },
  {
    id: "26",
    title: "Team W1 vs Team X1",
    start: "2025-07-30T18:30:00",
    end: "2025-07-30T20:30:00",

    extendedProps: {
      type: "match",
      league: "Prospects",
      map: "de_mirage",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team W1",
      team2: "Team X1",
      description: "Evening match"
    }
  },
  {
    id: "27",
    title: "Team Y1 vs Team Z1",
    start: "2025-07-30T21:00:00",
    end: "2025-07-30T23:00:00",

    extendedProps: {
      type: "match",
      league: "Prospects",
      map: "de_inferno",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team Y1",
      team2: "Team Z1",
      description: "Night match"
    }
  },
  {
    id: "28",
    title: "Team A2 vs Team B2",
    start: "2025-07-30T18:15:00",
    end: "2025-07-30T20:15:00",

    extendedProps: {
      type: "match",
      league: "Div4",
      map: "de_overpass",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team A2",
      team2: "Team B2",
      description: "Evening match"
    }
  },
  {
    id: "29",
    title: "Team C2 vs Team D2",
    start: "2025-07-30T20:45:00",
    end: "2025-07-30T22:45:00",

    extendedProps: {
      type: "match",
      league: "Div4",
      map: "de_ancient",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team C2",
      team2: "Team D2",
      description: "Night match"
    }
  },
  {
    id: "30",
    title: "Team E2 vs Team F2",
    start: "2025-07-30T15:00:00",
    end: "2025-07-30T17:00:00",

    extendedProps: {
      type: "match",
      league: "Div4",
      map: "de_vertigo",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team E2",
      team2: "Team F2",
      description: "Late afternoon match"
    }
  },
  {
    id: "31",
    title: "Team G2 vs Team H2",
    start: "2025-07-30T17:30:00",
    end: "2025-07-30T19:30:00",

    extendedProps: {
      type: "match",
      league: "Div4",
      map: "de_nuke",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team G2",
      team2: "Team H2",
      description: "Evening match"
    }
  },
  {
    id: "32",
    title: "Team I2 vs Team J2",
    start: "2025-07-30T20:00:00",
    end: "2025-07-30T22:00:00",

    extendedProps: {
      type: "match",
      league: "Div4",
      map: "de_cache",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team I2",
      team2: "Team J2",
      description: "Night match"
    }
  },
  {
    id: "33",
    title: "Team K2 vs Team L2",
    start: "2025-07-30T22:30:00",
    end: "2025-07-31T00:30:00",

    extendedProps: {
      type: "match",
      league: "Div4",
      map: "de_train",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team K2",
      team2: "Team L2",
      description: "Late night match"
    }
  },
  {
    id: "34",
    title: "Team M2 vs Team N2",
    start: "2025-07-30T19:15:00",
    end: "2025-07-30T21:15:00",

    extendedProps: {
      type: "match",
      league: "Div5",
      map: "de_cobblestone",
      streamUrl: "https://twitch.tv/kanaliiga",
      team1: "Team M2",
      team2: "Team N2",
      description: "Evening match"
    }
  }
];

// Process raw events to add correct colors based on division
const mockEvents = rawMockEvents.map((event) => {
  const division = event.extendedProps.league as DivisionName;
  const colors = DIVISIONS[division];
  return {
    ...event,
    backgroundColor: colors.color,
    borderColor: colors.borderColor
  };
});

interface EventDetails {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    type: string;
    league: string;
    map: string;
    streamUrl: string;
    team1: string;
    team2: string;
    description: string;
  };
}

export default function CalendarPage({ seasonId }: { seasonId: string }) {
  const _seasonToFetch = seasonId;
  const [view, setView] = useState<"dayGridMonth" | "timeGridWeek">(
    "dayGridMonth"
  );
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<
    DivisionName | "all"
  >("all");
  const calendarRef = useRef<FullCalendar>(null);

  // Filter events based on selected division
  const filteredEvents = useMemo(() => {
    if (selectedDivision === "all") {
      return mockEvents;
    }
    return mockEvents.filter(
      (event) => event.extendedProps.league === selectedDivision
    );
  }, [selectedDivision]);

  // Debug: Log events to console
  console.log(
    "Mock events:",
    mockEvents.length,
    "events loaded",
    "Filtered:",
    filteredEvents.length
  );

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
      events: filteredEvents,
      eventClick: (info: EventClickArg) => {
        const event = info.event;
        setSelectedEvent({
          id: event.id,
          title: event.title,
          start: event.startStr,
          end: event.endStr,
          extendedProps: event.extendedProps as EventDetails["extendedProps"]
        });
        setIsDialogOpen(true);
      },
      eventContent: (arg: EventContentArg) => {
        const props = arg.event.extendedProps as {
          map: string;
          league: string;
        };
        return (
          <div className="p-1 text-xs">
            <div className="font-semibold truncate">{arg.event.title}</div>
            <div className="text-xs opacity-75">{props.map}</div>
            <div className="text-xs font-medium mt-0.5">{props.league}</div>
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
    [view, filteredEvents]
  );

  const handleViewChange = (newView: "dayGridMonth" | "timeGridWeek") => {
    setView(newView);
  };

  const handleStreamClick = () => {
    if (selectedEvent?.extendedProps.streamUrl) {
      window.open(selectedEvent.extendedProps.streamUrl, "_blank");
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
                      value={selectedDivision}
                      onValueChange={(value: DivisionName | "all") =>
                        setSelectedDivision(value)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Division" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Divisions</SelectItem>
                        <SelectItem value="Masters">Masters</SelectItem>
                        <SelectItem value="Challengers">Challengers</SelectItem>
                        <SelectItem value="Prospects">Prospects</SelectItem>
                        <SelectItem value="Div4">Div4</SelectItem>
                        <SelectItem value="Div5">Div5</SelectItem>
                        <SelectItem value="Div6">Div6</SelectItem>
                        <SelectItem value="Div7">Div7</SelectItem>
                        <SelectItem value="Div8">Div8</SelectItem>
                        <SelectItem value="Div9">Div9</SelectItem>
                        <SelectItem value="Div10">Div10</SelectItem>
                        <SelectItem value="Div11">Div11</SelectItem>
                        <SelectItem value="Div12">Div12</SelectItem>
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
                {Object.entries(DIVISIONS).map(([division, colors]) => (
                  <div key={division} className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors.color }}
                    ></div>
                    <span className="text-xs">{division}</span>
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
                {filteredEvents
                  .sort(
                    (a, b) =>
                      new Date(a.start).getTime() - new Date(b.start).getTime()
                  )
                  .map((event) => (
                    <div
                      key={event.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer gap-3"
                      onClick={() => {
                        setSelectedEvent({
                          id: event.id,
                          title: event.title,
                          start: event.start,
                          end: event.end,
                          extendedProps: event.extendedProps
                        });
                        setIsDialogOpen(true);
                      }}
                    >
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                          style={{ backgroundColor: event.backgroundColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {event.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.start), "PPP 'at' p")} -{" "}
                            {format(new Date(event.end), "p")}
                          </p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {event.extendedProps.map}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {event.extendedProps.league}
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
              <div>
                <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedEvent.extendedProps.description}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(selectedEvent.start), "PPP 'at' p")} -{" "}
                    {format(new Date(selectedEvent.end), "p")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Map: {selectedEvent.extendedProps.map}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedEvent.extendedProps.league}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {selectedEvent.extendedProps.type}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleStreamClick}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Watch Stream
                </Button>
                <Button variant="outline">View Match Details</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
