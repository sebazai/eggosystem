"use client";

import { Card, CardContent } from "@/components/ui/card";
import { createNextUrl } from "@/lib/utils";
import { CheckCircleIcon, Loader2Icon, XCircleIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { z } from "zod";

const responseSchema = z.object({
  message: z.string().optional(),
  detail: z.string().optional(),
  season_id: z.number().nullable().optional()
});

type RemoveState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string; seasonId?: number | null }
  | { status: "error"; message: string; seasonId?: number | null };

function calendarHref(seasonId: number | null | undefined): string {
  return seasonId != null
    ? createNextUrl(`/seasons/${seasonId}/calendar`)
    : createNextUrl("/");
}

export function RemoveReservationClient({ hash }: { hash: string }) {
  const [state, setState] = useState<RemoveState>({ status: "idle" });

  const calendarLink = useMemo(() => {
    if (state.status === "success" || state.status === "error") {
      return calendarHref(state.seasonId);
    }
    return calendarHref(undefined);
  }, [state]);

  const removeReservation = async () => {
    if (!hash) return;
    setState({ status: "loading" });

    const res = await fetch("/api/reservations/remove", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: hash })
    });

    const json: unknown = await res.json().catch(() => ({}));
    const parsed = responseSchema.safeParse(json);
    const data = parsed.success ? parsed.data : {};

    const message = res.ok
      ? (data.message ?? "Your stream reservation was removed successfully.")
      : (data.detail ??
        data.message ??
        "This link is invalid or the reservation was already removed.");

    if (res.ok) {
      setState({ status: "success", message, seasonId: data.season_id });
    } else {
      setState({ status: "error", message, seasonId: data.season_id });
    }
  };

  if (!hash) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4">
          <XCircleIcon
            className="h-16 w-16 text-destructive"
            data-testid="remove-reservation-x-circle"
          />
          <h1 className="text-2xl font-bold">Invalid link</h1>
          <p className="text-muted-foreground text-center">
            No reservation token found.
          </p>
          <Link
            href={calendarLink}
            className="px-4 py-2 bg-kanaliiga-orange rounded-md text-white hover:bg-kanaliiga-orange/70"
          >
            View calendar
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (state.status === "success") {
    return (
      <Card
        className="w-full max-w-md"
        data-testid="remove-reservation-success-card"
      >
        <CardContent className="flex flex-col items-center gap-4">
          <CheckCircleIcon
            className="h-16 w-16 text-[hsl(35,93%,49%)]"
            data-testid="remove-reservation-check-circle"
          />
          <h1 className="text-2xl font-bold">Reservation removed</h1>
          <p className="text-muted-foreground text-center">{state.message}</p>
          <Link
            href={calendarLink}
            className="px-4 py-2 bg-kanaliiga-orange rounded-md text-white hover:bg-kanaliiga-orange/70"
          >
            View calendar
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (state.status === "error") {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4">
          <XCircleIcon
            className="h-16 w-16 text-destructive"
            data-testid="remove-reservation-x-circle"
          />
          <h1 className="text-2xl font-bold">Could not remove reservation</h1>
          <p className="text-muted-foreground text-center">{state.message}</p>
          <Link
            href={calendarLink}
            className="px-4 py-2 bg-kanaliiga-orange rounded-md text-white hover:bg-kanaliiga-orange/70"
          >
            View calendar
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col items-center gap-4">
        {state.status === "loading" ? (
          <>
            <Loader2Icon className="h-12 w-12 animate-spin text-[hsl(35,93%,49%)]" />
            <h1 className="text-2xl font-bold">Removing reservation...</h1>
            <p className="text-muted-foreground text-center">
              Please wait a moment.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Remove reservation?</h1>
            <p className="text-muted-foreground text-center">
              Confirm to remove your stream reservation.
            </p>
            <button
              type="button"
              onClick={removeReservation}
              className="px-4 py-2 bg-kanaliiga-orange rounded-md text-white hover:bg-kanaliiga-orange/70"
            >
              Remove reservation
            </button>
            <Link
              href={calendarLink}
              className="text-sm text-muted-foreground hover:underline"
            >
              Cancel
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
