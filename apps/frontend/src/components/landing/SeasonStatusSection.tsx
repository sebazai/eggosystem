"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useActiveSignupOrActiveSeasonForApp } from "@/hooks/data/useActiveSignupOrActiveSeasonForApp";
import { createNextUrl } from "@/lib/utils";
import { SeasonButtons } from "./SeasonButtons";

export function SeasonStatusSection() {
  // Get current season (CS2 app ID is 730)
  const { signupOrActiveSeason, isLoading } =
    useActiveSignupOrActiveSeasonForApp(730);
  const currentSeasonId = signupOrActiveSeason?.season_id?.toString() || "16"; // fallback to season 16

  // Determine season status based on dates - only calculate on client to avoid hydration mismatch
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

    // Season is live if: start_date <= now AND (end_date is null OR end_date >= now)
    const isSeasonLive =
      startDate && startDate <= now && (endDate === null || endDate >= now);

    // Signup is open if: signup_start_date <= now AND signup_end_date >= now AND start_date > now
    const isSignupOpen =
      signupStartDate &&
      signupStartDate <= now &&
      signupEndDate &&
      signupEndDate >= now &&
      startDate &&
      startDate > now;

    // Extract season number from full_name (e.g., "CS2 Season 4" -> "4")
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
        <div className="h-10 bg-slate-700 rounded w-3/4 mb-6"></div>
        <div className="h-6 bg-slate-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-slate-700 rounded w-full mb-6"></div>
      </div>
    );
  }

  // Show content based on season status
  if (seasonStatus.isSeasonLive) {
    return (
      <>
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">
          🎮 CS2 Season {seasonStatus.seasonNumber} – Live Now
        </h2>
        <p className="text-lg mb-2 text-slate-300">
          <strong>Season is currently in progress</strong>
          <br />
          <strong>Watch live matches and follow your favorite teams</strong>
        </p>

        <p className="mb-6 text-slate-300">
          The latest installment of our most competitive and community-driven
          Counter-Strike 2 season is now live! With hundreds of teams competing
          across multiple divisions,{" "}
          <strong>CS2 Season {seasonStatus.seasonNumber}</strong> is delivering
          intense matches, epic plays, and unmatched corporate camaraderie every
          week.
        </p>

        <ul className="list-disc list-inside mb-10 px-4 pb-2 text-slate-300">
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
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">
          📝 Registration for Season {seasonStatus.seasonNumber} Open!
        </h2>
        <p className="text-lg mb-2 text-slate-300">
          <strong>Sign up your team for the upcoming season</strong>
          <br />
          <strong>
            Secure your spot in Finland&apos;s premier corporate esports league
          </strong>
        </p>

        <p className="mb-6 text-slate-300">
          Get ready for an exciting new season of corporate Counter-Strike 2!
          Register your team now and be part of{" "}
          <strong>CS2 Season {seasonStatus.seasonNumber}</strong>. Whether
          you&apos;re returning champions or new challengers, there&apos;s a
          division waiting for your team.
        </p>

        <ul className="list-disc list-inside mb-10 px-4 pb-2 text-slate-300">
          <li>Multiple divisions for all skill levels</li>
          <li>Flexible match scheduling</li>
          <li>Professional tournament organization</li>
          <li>Connect with other corporate gaming enthusiasts</li>
        </ul>

        <div className="text-center pb-3 flex flex-col sm:flex-row gap-4 sm:gap-4 sm:justify-center">
          <Link
            href={createNextUrl(`/seasons/${currentSeasonId}/signup`)}
            className="inline-flex items-center justify-center rounded-md text-lg py-2 px-6 font-medium bg-kanaliiga-orange text-white hover:bg-kanaliiga-orange/70 transition-colors"
          >
            Register Your Team →
          </Link>
          <Link
            href={createNextUrl("/matches")}
            className="inline-flex items-center justify-center rounded-md text-lg py-2 px-6 font-medium border border-slate-500 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Browse Past Matches
          </Link>
        </div>
      </>
    );
  }

  // Off-season / no active season
  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">
        🎮 CS2 Corporate League
      </h2>
      <p className="text-lg mb-2 text-slate-300">
        <strong>Finland&apos;s premier corporate esports competition</strong>
      </p>

      <p className="mb-6 text-slate-300">
        Season has concluded. Stay tuned for announcements about the next season
        and registration opening. In the meantime, browse our extensive archive
        of past matches and team statistics.
      </p>

      <ul className="list-disc list-inside mb-10 px-4 pb-2 text-slate-300">
        <li>Review past season highlights and standings</li>
        <li>Explore team histories and player statistics</li>
        <li>Check back for upcoming season announcements</li>
      </ul>

      <SeasonButtons />
    </>
  );
}
