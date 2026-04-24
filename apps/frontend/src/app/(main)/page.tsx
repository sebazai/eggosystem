"use server";

import { SponsorContainer } from "@/components/sponsors/SponsorContainer";
import { envConfig } from "@/configs/env";
import { SectionSeparator, StatCard } from "@/components/kanaliiga";
import Link from "next/link";
import HeroSection from "@/components/layout/HeroSection";
import { SeasonStatusSection } from "@/components/landing/SeasonStatusSection";
import { Navigation } from "@/components/layout/Navigation";
import { createNextUrl } from "@/lib/utils";
import { MarketingSponsorLogoGrid } from "@/components/sponsors/MarketingSponsorLogoGrid";
import {
  getGameWideMarketingSponsorsForGame,
  getPublicMarketingSponsors,
  landingGameAbbrev
} from "@/lib/get-public-marketing-sponsors";

interface LandingPageStats {
  unique_players: number;
  total_teams: number;
  total_games: number;
  total_organizations: number;
}

export default async function Home() {
  const [sponsors, gameWideFeatured] = await Promise.all([
    getPublicMarketingSponsors(),
    getGameWideMarketingSponsorsForGame(landingGameAbbrev)
  ]);

  const defaultData = {
    unique_players: 4700,
    total_teams: 800,
    total_games: 15000,
    total_organizations: 220
  } satisfies LandingPageStats;

  let data: LandingPageStats = defaultData;

  try {
    // No cache required, as otherwise build fails
    const statistics = await fetch(`${envConfig.API_URL}/api/v1/stats`, {
      cache: "no-cache"
    });
    if (statistics.ok) {
      data = await statistics.json();
    }
  } catch (error) {
    // Use default data if fetch fails (e.g., during build time)
    console.warn("Failed to fetch statistics, using default data:", error);
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <Navigation options={{ removeBottomPadding: true, fullWidth: true }} />
      <section>
        <HeroSection />
      </section>
      <section className="py-12 md:py-24 lg:py-32 2xl:py-40">
        <div className="flex flex-grow justify-center items-center w-full">
          <div className="w-full max-w-[1920px] px-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl 2xl:text-6xl my-8">
              Building Corporate Culture Through Esports
            </h1>
            <p className="mb-4 text-xl lg:text-2xl 2xl:text-3xl text-muted-foreground">
              Since 2018, Kanaliiga has been pioneering corporate esports in
              Finland, bringing together{" "}
              <strong>over 2,500 professionals from 300+ companies</strong>{" "}
              annually. We&apos;re transforming workplace connections through
              competitive gaming.
            </p>
            <p className="mb-6 text-lg lg:text-xl 2xl:text-2xl text-muted-foreground">
              Our leagues foster teamwork, networking, and friendly competition
              while building lasting connections across Finland&apos;s business
              landscape.
            </p>

            <SectionSeparator />

            {/* Statistic Cards for All Seasons */}
            <h3 className="xs:text-2xl mb-4">
              All-Time Highlights For Counter-Strike
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <Link href={createNextUrl("/organizations")}>
                <StatCard
                  value={data.total_organizations}
                  label="Organizations"
                />
              </Link>
              <Link href={createNextUrl("/teams")}>
                <StatCard value={data.total_teams} label="Unique Teams" />
              </Link>
              <Link href={createNextUrl("/players")}>
                <StatCard value={data.unique_players} label="Unique Players" />
              </Link>
              <Link href={createNextUrl("/matches")}>
                <StatCard value={data.total_games} label="Total Games Played" />
              </Link>
            </div>

            <SectionSeparator />

            {/* Dynamic Season Status Section */}
            <SeasonStatusSection />

            <SectionSeparator />

            {gameWideFeatured.length > 0 ? (
              <SponsorContainer
                header={`MAIN ${landingGameAbbrev.toUpperCase()} SPONSOR`}
                classNames="mt-10 sm:mt-20"
              >
                <MarketingSponsorLogoGrid items={gameWideFeatured} eager />
              </SponsorContainer>
            ) : null}

            {sponsors.main_partners.length > 0 ? (
              <SponsorContainer
                classNames="mt-10 sm:mt-20"
                header="Main Partners"
              >
                <MarketingSponsorLogoGrid
                  items={sponsors.main_partners}
                  eager
                />
              </SponsorContainer>
            ) : null}

            {sponsors.supporting_organizations.length > 0 ? (
              <SponsorContainer
                classNames="mt-10 sm:mt-20"
                secondary={true}
                header="Supporting Our Tournaments"
              >
                <MarketingSponsorLogoGrid
                  items={sponsors.supporting_organizations}
                  eager
                />
              </SponsorContainer>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
