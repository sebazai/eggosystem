import { Card, CardContent } from "@/components/ui/card";
import { CheckCircleIcon, XCircleIcon, Loader2Icon } from "lucide-react";
import { Suspense } from "react";
import { envConfig } from "@/configs/env";
import Link from "next/link";
import { createNextUrl } from "@/lib/utils";

interface RemoveReservationPageProps {
  params: Promise<{ hash: string }>;
}

function calendarHref(seasonId: number | null | undefined): string {
  return seasonId != null
    ? createNextUrl(`/seasons/${seasonId}/calendar`)
    : createNextUrl("/");
}

function RemoveReservationContent({
  hash,
  success,
  message,
  seasonId
}: {
  hash: string;
  success: boolean;
  message: string;
  seasonId?: number | null;
}) {
  const calendarLink = calendarHref(seasonId);

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

  if (success) {
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
          <p className="text-muted-foreground text-center">{message}</p>
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
        <XCircleIcon
          className="h-16 w-16 text-destructive"
          data-testid="remove-reservation-x-circle"
        />
        <h1 className="text-2xl font-bold">Could not remove reservation</h1>
        <p className="text-muted-foreground text-center">{message}</p>
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

export default async function RemoveReservationPage({
  params
}: RemoveReservationPageProps) {
  const { hash } = await params;

  if (!hash) {
    return (
      <div className="flex justify-center p-4">
        <Suspense
          fallback={
            <Card className="w-full max-w-md">
              <CardContent className="flex flex-col items-center gap-4">
                <Loader2Icon className="h-12 w-12 animate-spin text-[hsl(35,93%,49%)]" />
                <h1 className="text-2xl font-bold">Loading...</h1>
              </CardContent>
            </Card>
          }
        >
          <RemoveReservationContent
            hash=""
            success={false}
            message="No reservation token found."
            seasonId={undefined}
          />
        </Suspense>
      </div>
    );
  }

  const res = await fetch(
    `${envConfig.API_URL}/api/v1/reservations/remove/${encodeURIComponent(hash)}`,
    { method: "GET", cache: "no-store" }
  );

  const data = (await res.json().catch(() => ({}))) as {
    message?: string;
    detail?: string;
    season_id?: number | null;
  };
  const message = res.ok
    ? (data.message ?? "Your stream reservation was removed successfully.")
    : (data.detail ??
      data.message ??
      "This link is invalid or the reservation was already removed.");
  const seasonId = res.ok ? data.season_id : undefined;

  return (
    <div className="flex justify-center p-4">
      <Suspense
        fallback={
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center gap-4">
              <Loader2Icon className="h-12 w-12 animate-spin text-[hsl(35,93%,49%)]" />
              <h1 className="text-2xl font-bold">
                Removing your reservation...
              </h1>
              <p className="text-muted-foreground text-center">
                Please wait a moment.
              </p>
            </CardContent>
          </Card>
        }
      >
        <RemoveReservationContent
          hash={hash}
          success={res.ok}
          message={message}
          seasonId={seasonId}
        />
      </Suspense>
    </div>
  );
}
