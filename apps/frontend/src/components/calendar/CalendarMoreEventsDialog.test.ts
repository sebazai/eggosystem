import type { EventApi } from "@fullcalendar/core";
import { expandTimeGridMoreLinkSegments } from "./CalendarMoreEventsDialog";

type HiddenSeg = Parameters<typeof expandTimeGridMoreLinkSegments>[1][number];

function mockTimedEvent(
  id: string,
  startIso: string,
  endIso: string,
  tier = 1
): EventApi {
  return {
    id,
    allDay: false,
    start: new Date(startIso),
    end: new Date(endIso),
    extendedProps: { tier }
  } as unknown as EventApi;
}

function mockSeg(ev: EventApi): HiddenSeg {
  const start = ev.start;
  const end = ev.end;
  if (!start || !end) {
    throw new Error("mock event needs start/end");
  }
  return {
    event: ev,
    start,
    end,
    isStart: true,
    isEnd: true
  };
}

describe("expandTimeGridMoreLinkSegments", () => {
  it("includes visible timed events that overlap the hidden cluster on the same day", () => {
    const columnDate = new Date("2025-06-01T12:00:00");

    const visibleEarlier = mockTimedEvent(
      "a",
      "2025-06-01T10:00:00",
      "2025-06-01T12:00:00"
    );
    const visibleOverlap = mockTimedEvent(
      "b",
      "2025-06-01T10:30:00",
      "2025-06-01T11:00:00"
    );
    const hidden1 = mockTimedEvent(
      "c",
      "2025-06-01T10:45:00",
      "2025-06-01T11:00:00"
    );
    const hidden2 = mockTimedEvent(
      "d",
      "2025-06-01T11:00:00",
      "2025-06-01T11:30:00"
    );
    const otherTimeSameDay = mockTimedEvent(
      "e",
      "2025-06-01T14:00:00",
      "2025-06-01T15:00:00"
    );
    const allDaySameDay = {
      id: "all-day",
      allDay: true,
      start: new Date("2025-06-01T00:00:00"),
      end: new Date("2025-06-02T00:00:00")
    } as unknown as EventApi;

    const calendarEvents: EventApi[] = [
      visibleEarlier,
      visibleOverlap,
      hidden1,
      hidden2,
      otherTimeSameDay,
      allDaySameDay
    ];

    const hiddenSegs = [mockSeg(hidden1), mockSeg(hidden2)];
    const expanded = expandTimeGridMoreLinkSegments(
      columnDate,
      hiddenSegs,
      calendarEvents
    );

    const ids = expanded.map((s) => s.event.id).sort();
    expect(ids).toEqual(["a", "b", "c", "d"]);
  });

  it("ignores events on other calendar days", () => {
    const columnDate = new Date("2025-06-01T10:00:00");
    const hidden = mockTimedEvent(
      "h",
      "2025-06-01T11:00:00",
      "2025-06-01T11:30:00"
    );
    const nextDay = mockTimedEvent(
      "next",
      "2025-06-02T11:00:00",
      "2025-06-02T11:30:00"
    );

    const expanded = expandTimeGridMoreLinkSegments(
      columnDate,
      [mockSeg(hidden)],
      [hidden, nextDay]
    );

    expect(expanded.map((s) => s.event.id)).toEqual(["h"]);
  });
});
