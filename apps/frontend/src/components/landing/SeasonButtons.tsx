"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLandingSeasonContext } from "@/hooks/data/useLandingSeasonContext";
import { createNextUrl } from "@/lib/utils";

export function SeasonButtons() {
  const { seasonPhase, referenceSeasonId } = useLandingSeasonContext();
  const isSeasonConcluded = seasonPhase.phase === "concluded";

  return (
    <div className="text-center pb-3 flex flex-col sm:flex-row gap-4 sm:gap-4 sm:justify-center">
      {isSeasonConcluded ? (
        <>
          <Button asChild variant="default" className="text-lg py-2 px-6">
            <Link
              href={createNextUrl(
                referenceSeasonId
                  ? `/season-results?season=${referenceSeasonId}`
                  : "/season-results"
              )}
            >
              View Season Results
            </Link>
          </Button>
          <Button asChild variant="outline" className="text-lg py-2 px-6">
            <Link href={createNextUrl("/past-seasons")}>
              Browse Past Seasons
            </Link>
          </Button>
        </>
      ) : (
        <>
          <Button asChild variant="default" className="text-lg py-2 px-6">
            <Link
              href={createNextUrl(`/seasons/${referenceSeasonId}/calendar`)}
            >
              View Match Calendar
            </Link>
          </Button>
          <Button asChild variant="outline" className="text-lg py-2 px-6">
            <Link href={createNextUrl("/matches")}>Browse All Matches</Link>
          </Button>
        </>
      )}
    </div>
  );
}
