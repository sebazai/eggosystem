"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useActiveSignupOrActiveSeasonForApp } from "@/hooks/data/useActiveSignupOrActiveSeasonForApp";

export function SeasonButtons() {
  // Get current season (CS2 app ID is typically 730)
  const { signupOrActiveSeason } = useActiveSignupOrActiveSeasonForApp(730);
  const currentSeasonId = signupOrActiveSeason?.season_id?.toString() || "16"; // fallback to season 16

  return (
    <div className="text-center pb-3 space-x-4">
      <Button asChild variant="default" className="text-lg py-2 px-6">
        <Link href={`/seasons/${currentSeasonId}/calendar`}>
          View Match Calendar
        </Link>
      </Button>
      <Button asChild variant="outline" className="text-lg py-2 px-6">
        <Link href="/matches">Browse All Matches</Link>
      </Button>
    </div>
  );
}
