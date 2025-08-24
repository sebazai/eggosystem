"use server";

import { Card, CardContent } from "@/components/ui/card";
import { CsMainSponsors } from "@/components/sponsors/CsMainSponsors";
import { KanaMainPartners } from "@/components/sponsors/KanaMainPartners";
import { SponsorContainer } from "@/components/sponsors/SponsorContainer";
import { CsSupportingOrgs } from "@/components/sponsors/CsSupportingOrgs";
import { envConfig } from "@/configs/env";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import HeroSection from "@/components/layout/HeroSection";
import { SeasonButtons } from "@/components/landing/SeasonButtons";
import { Navigation } from "@/components/layout/Navigation";

interface LandingPageStats {
  unique_players: number;
  total_teams: number;
  total_games: number;
  total_organizations: number;
}

export default async function Home() {
  const defaultData = {
    unique_players: 4700,
    total_teams: 800,
    total_games: 15000,
    total_organizations: 220
  } satisfies LandingPageStats;
  // No cache required, as otherwise build fails
  const statistics = await fetch(`${envConfig.API_URL}/api/v1/stats`, {
    cache: "no-cache"
  });
  const data: LandingPageStats = statistics.ok
    ? await statistics.json()
    : defaultData;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <section>
        <Navigation options={{ removeBottomPadding: true }} />
        <HeroSection />
      </section>
      <section className="py-12 md:py-24 lg:py-32 2xl:py-40">
        <div className="flex flex-grow justify-center items-center w-full">
          <div className="w-full max-w-[1920px] px-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl 2xl:text-6xl font-bold my-8 text-white">
              Building Corporate Culture Through Esports
            </h1>
            <p className="mb-4 text-xl lg:text-2xl 2xl:text-3xl text-slate-300">
              Since 2018, Kanaliiga has been pioneering corporate esports in
              Finland, bringing together{" "}
              <strong>over 2,500 professionals from 300+ companies</strong>{" "}
              annually. We&apos;re transforming workplace connections through
              competitive gaming.
            </p>
            <p className="mb-6 text-lg lg:text-xl 2xl:text-2xl text-slate-300">
              Our leagues foster teamwork, networking, and friendly competition
              while building lasting connections across Finland&apos;s business
              landscape.
            </p>

            <Separator className="bg-kanaliiga-orange my-3 md:my-6" />

            {/* Statistic Cards for All Seasons */}
            <h3 className="xs:text-2xl font-semibold mb-4 text-white">
              📊 All-Time Highlights For Counter-Strike
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <Link href={"/organizations"}>
                <Card className="shadow-md dark:shadow-white/20 hover:bg-kanaliiga-light-brown/30">
                  <CardContent className="p-2 sm:p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-kanaliiga-orange">
                      {data.total_organizations}+
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Organizations
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link href={"/teams"}>
                <Card className="shadow-md dark:shadow-white/20 hover:bg-kanaliiga-light-brown/30">
                  <CardContent className="p-2 sm:p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-kanaliiga-orange">
                      {data.total_teams}+
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Unique Teams
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link href={"/players"}>
                <Card className="shadow-md dark:shadow-white/20 hover:bg-kanaliiga-light-brown/30">
                  <CardContent className="p-2 sm:p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-kanaliiga-orange">
                      {data.unique_players}+
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Unique Players
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link href={"/matches"}>
                <Card className="shadow-md dark:shadow-white/20 hover:bg-kanaliiga-light-brown/30">
                  <CardContent className="p-2 sm:p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-kanaliiga-orange">
                      {data.total_games}+
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total Games Played
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>

            <Separator className="bg-kanaliiga-orange my-3 md:my-6" />

            {/* CS2 Season 4 Current Season */}
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">
              🎮 CS2 Season 4 – Live Now
            </h2>
            <p className="text-lg mb-2 text-slate-300">
              <strong>Season is currently in progress</strong>
              <br />
              <strong>Watch live matches and follow your favorite teams</strong>
            </p>

            <p className="mb-6 text-slate-300">
              The fourth installment of our most competitive and
              community-driven Counter-Strike 2 season is now live! With
              hundreds of teams competing across multiple divisions,{" "}
              <strong>CS2 Season 4</strong> is delivering intense matches, epic
              plays, and unmatched corporate camaraderie every week.
            </p>

            <ul className="list-disc list-inside mb-10 px-4 pb-2 text-slate-300">
              <li>Watch live matches on our Twitch streams</li>
              <li>Follow your favorite teams and players</li>
              <li>Track standings and statistics in real-time</li>
              <li>Join the community discussions and predictions</li>
            </ul>

            <SeasonButtons />

            <Separator className="bg-kanaliiga-orange my-3 md:my-6" />

            <SponsorContainer
              header="CS2 Season 4 Main Sponsors"
              classNames="mt-10 sm:mt-20"
            >
              <CsMainSponsors />
            </SponsorContainer>

            <SponsorContainer
              classNames="mt-10 sm:mt-20"
              secondary={true}
              header="Supporting our tournaments"
            >
              <CsSupportingOrgs />
            </SponsorContainer>

            <SponsorContainer
              classNames="mt-10 sm:mt-20"
              header="Main Partners"
            >
              <KanaMainPartners />
            </SponsorContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
