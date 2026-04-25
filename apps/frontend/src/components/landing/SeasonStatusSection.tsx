"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useActiveSignupOrActiveSeasonForApp } from "@/hooks/data/useActiveSignupOrActiveSeasonForApp";
import { createNextUrl } from "@/lib/utils";
import { SeasonButtons } from "./SeasonButtons";
import { Button } from "@/components/ui/button";

export function SeasonStatusSection() {
  const { signupOrActiveSeason, isLoading } =
    useActiveSignupOrActiveSeasonForApp(730);
  const currentSeasonId = signupOrActiveSeason?.season_id?.toString() || "16";

  const seasonStatus = useMemo(() => {
    if (!signupOrActiveSeason) {
      return { isSeasonLive: false, isSignupOpen: false, seasonNumber: null };
    }

    const now = new Date();
    const startDate = signupOrActiveSeason.start_date
      ? new Date(signupOrActiveSeason.start_date)
      : null;
    const endDate = signupOrActiveSeason.end_date
      ? new Date(signupOrActiveSeason.end_date)
      : null;
    const signupStartDate = signupOrActiveSeason.signup_start_date
      ? new Date(signupOrActiveSeason.signup_start_date)
      : null;
    const signupEndDate = signupOrActiveSeason.signup_end_date
      ? new Date(signupOrActiveSeason.signup_end_date)
      : null;

    const isSeasonLive =
      startDate && startDate <= now && (endDate === null || endDate >= now);

    const isSignupOpen =
      signupStartDate &&
      signupStartDate <= now &&
      signupEndDate &&
      signupEndDate >= now &&
      startDate &&
      startDate > now;

    const seasonName =
      signupOrActiveSeason.full_name ||
      `Season ${signupOrActiveSeason.season_id ?? "Unknown"}`;
    const seasonNumberMatch = seasonName.match(/Season\s+(\d+)/i);
    const seasonNumber = seasonNumberMatch
      ? seasonNumberMatch[1]
      : (signupOrActiveSeason.season_id?.toString() ?? "Unknown");

    return { isSeasonLive, isSignupOpen, seasonNumber };
  }, [signupOrActiveSeason]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-muted rounded w-3/4 mb-6"></div>
        <div className="h-6 bg-muted rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-muted rounded w-full mb-6"></div>
      </div>
    );
  }

  if (seasonStatus.isSeasonLive) {
    return (
      <>
        <h2 className="text-2xl sm:text-3xl mb-6">
          CS2 Season {seasonStatus.seasonNumber} – Live Now
        </h2>
        <p className="text-lg mb-2 text-muted-foreground">
          <strong>Season is currently in progress</strong>
          <br />
          <strong>Watch live matches and follow your favorite teams</strong>
        </p>

        <p className="mb-6 text-muted-foreground">
          The latest installment of our CS2 season is now live. Hundreds of
          teams compete across multiple divisions —{" "}
          <strong>CS2 Season {seasonStatus.seasonNumber}</strong> delivers
          intense matches and corporate competition every week.
        </p>

        <ul className="list-disc list-inside mb-10 px-4 pb-2 text-muted-foreground">
          <li>Watch live matches on our Twitch streams</li>
          <li>Follow your favorite teams and players</li>
          <li>Track standings and statistics in real-time</li>
          <li>Join the community discussions and predictions</li>
        </ul>

        <SeasonButtons />
      </>
    );
  }

  if (seasonStatus.isSignupOpen) {
    return (
      <>
        <h2 className="text-2xl sm:text-3xl mb-6">
          Registration for Season {seasonStatus.seasonNumber} Open
        </h2>
        <p className="text-lg mb-2 text-muted-foreground">
          <strong>Sign up your team for the upcoming season</strong>
          <br />
          <strong>
            Secure your spot in Finland&apos;s corporate esports league
          </strong>
        </p>

        <p className="mb-6 text-muted-foreground">
          Register your team now and be part of{" "}
          <strong>CS2 Season {seasonStatus.seasonNumber}</strong>. Whether
          you&apos;re returning champions or new challengers, there&apos;s a
          division for your team.
        </p>

        <ul className="list-disc list-inside mb-10 px-4 pb-2 text-muted-foreground">
          <li>Multiple divisions for all skill levels</li>
          <li>Flexible match scheduling</li>
          <li>Structured tournament format</li>
          <li>Connect with other corporate gaming enthusiasts</li>
        </ul>

        <div className="text-center pb-3 flex flex-col sm:flex-row gap-4 sm:justify-center">
          <Button
            asChild
            className="bg-kanaliiga-orange hover:bg-kanaliiga-orange/90 text-white text-lg py-2 px-6 h-auto"
          >
            <Link href={createNextUrl(`/seasons/${currentSeasonId}/signup`)}>
              Register Your Team →
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="text-lg py-2 px-6 h-auto"
          >
            <Link href={createNextUrl("/matches")}>Browse Past Matches</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <h2 className="text-2xl sm:text-3xl mb-6">CS2 Corporate League</h2>
      <p className="text-lg mb-2 text-muted-foreground">
        <strong>Finland&apos;s corporate esports competition</strong>
      </p>

      <p className="mb-6 text-muted-foreground">
        Season has concluded. Stay tuned for announcements about the next season
        and registration opening. In the meantime, browse our archive of past
        matches and team statistics.
      </p>

      <ul className="list-disc list-inside mb-10 px-4 pb-2 text-muted-foreground">
        <li>Review past season highlights and standings</li>
        <li>Explore team histories and player statistics</li>
        <li>Check back for upcoming season announcements</li>
      </ul>

      <SeasonButtons />
    </>
  );
}
