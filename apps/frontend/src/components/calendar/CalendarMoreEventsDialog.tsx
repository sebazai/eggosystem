"use client";

import { useCallback, useState } from "react";
import type {
  EventApi,
  MoreLinkArg,
  MoreLinkHandler
} from "@fullcalendar/core";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { formatInTimezone } from "@/lib/timezone";

function segmentHasStream(seg: MoreLinkArg["hiddenSegs"][number]): boolean {
  const urls = seg.event.extendedProps?.streamUrl;
  if (Array.isArray(urls) && urls.length > 0) return true;
  return seg.event.extendedProps?.hasStream === true;
}

/** Same ordering as the legacy in-calendar popover: time, streams first, then tier. */
function sortMoreLinkHiddenSegments(
  segments: MoreLinkArg["hiddenSegs"]
): MoreLinkArg["hiddenSegs"] {
  return [...segments].sort((a, b) => {
    const timeComparison = a.start.getTime() - b.start.getTime();
    if (timeComparison !== 0) return timeComparison;

    const streamA = segmentHasStream(a);
    const streamB = segmentHasStream(b);
    if (streamA !== streamB) return streamA ? -1 : 1;

    const tierA = Number(a.event.extendedProps?.tier ?? 999);
    const tierB = Number(b.event.extendedProps?.tier ?? 999);
    return tierA - tierB;
  });
}

export function CalendarMoreEventsDialog({
  open,
  onOpenChange,
  title,
  segments,
  onEventSelect
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  segments: MoreLinkArg["hiddenSegs"];
  onEventSelect: (event: EventApi) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[85vh] max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b px-6 py-4 text-left">
          <DialogTitle className="pr-8">{title}</DialogTitle>
          <p className="text-muted-foreground text-sm font-normal">
            {segments.length} {segments.length === 1 ? "match" : "matches"}
          </p>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6">
          <ul className="flex flex-col gap-2">
            {segments.map((seg) => {
              const ev = seg.event;
              const startTime = formatInTimezone(ev.startStr, "p");
              const hasStream = segmentHasStream(seg);
              const bg = ev.backgroundColor ?? "#6b7280";
              return (
                <li key={ev.id}>
                  <button
                    type="button"
                    className="focus-visible:ring-ring w-full rounded-md px-3 py-2.5 text-left text-xs text-white shadow-sm transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:outline-none"
                    style={{
                      backgroundColor: bg,
                      border: hasStream
                        ? "2px solid #f59e0b"
                        : "1px solid rgba(255, 255, 255, 0.25)"
                    }}
                    onClick={() => {
                      onEventSelect(ev);
                      onOpenChange(false);
                    }}
                  >
                    <div className="font-semibold leading-tight">
                      {ev.title}
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5 shrink-0 opacity-90" />
                      <span>{startTime}</span>
                      {hasStream ? (
                        <span
                          className="text-amber-300"
                          title="Stream link available"
                        >
                          ● Stream
                        </span>
                      ) : null}
                    </div>
                    {ev.extendedProps?.league ? (
                      <div className="mt-0.5 opacity-90">
                        {String(ev.extendedProps.league)}
                      </div>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * State + handler for FullCalendar "+N more" links. Returns a handler typed for
 * `CalendarOptions.moreLinkClick`; FullCalendar's types omit the boolean return that
 * skips the built-in popover.
 */
export function useCalendarMoreLinkDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [segments, setSegments] = useState<MoreLinkArg["hiddenSegs"]>([]);

  const onOpenChange = useCallback((next: boolean) => {
    setOpen(next);
  }, []);

  const moreLinkClick = useCallback((info: MoreLinkArg) => {
    setTitle(format(info.date, "PPPP"));
    setSegments(sortMoreLinkHiddenSegments(info.hiddenSegs));
    setOpen(true);
    return true;
  }, []);

  return {
    open,
    title,
    segments,
    onOpenChange,
    moreLinkClickForFullCalendar: moreLinkClick as unknown as MoreLinkHandler
  };
}
