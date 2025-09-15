"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useActiveSignupOrActiveSeasonForApp } from "@/hooks/data/useActiveSignupOrActiveSeasonForApp";
import { createNextUrl } from "@/lib/utils";

export function SeasonButtons() {
  // Get current season (CS2 app ID is typically 730)
  const { signupOrActiveSeason } = useActiveSignupOrActiveSeasonForApp(730);
  const currentSeasonId = signupOrActiveSeason?.season_id?.toString() || "16"; // fallback to season 16

  return (
    <div className="text-center pb-3 flex flex-col sm:flex-row gap-4 sm:gap-4 sm:justify-center">
      <Button asChild variant="default" className="text-lg py-2 px-6">
        <Link href={createNextUrl(`/seasons/${currentSeasonId}/calendar`)}>
          View Match Calendar
        </Link>
      </Button>
      <Button asChild variant="outline" className="text-lg py-2 px-6">
        <Link href={createNextUrl("/matches")}>Browse All Matches</Link>
      </Button>
    </div>
  );
}
