"use server";

import HeroSection from "@/components/layout/hero-section";
import { SignupButton } from "@/components/signup/call-to-action-signup-button";
import { Card, CardContent } from "@/components/ui/card";
import { headers } from "next/headers";
import { userAgent } from "next/server";
import { CsMainSponsors } from "@/components/sponsors/cs-main-sponsors";
import { KanaMainPartners } from "@/components/sponsors/kana-main-partners";
import { SponsorContainer } from "@/components/sponsors/sponsor-container";
import { CsSupportingOrgs } from "@/components/sponsors/cs-supporting-orgs";
import { envConfig } from "@/configs/env";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

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
  const statistics = await fetch(`${envConfig.API_URL}/api/v1/stats`, {
    cache: "force-cache",
    next: {
      revalidate: 60 * 60 * 24
    }
  });
  const data: LandingPageStats = statistics.ok
    ? await statistics.json()
    : defaultData;

  const { device } = userAgent({ headers: await headers() });
  const deviceType = device?.type === "mobile" ? "mobile" : "desktop";
  return (
    <>
      <section>
        <HeroSection device={deviceType} />
      </section>
      <section className="my-8 md:my-16 lg:my-32">
        <div className="flex flex-grow justify-center items-center min-h-screen w-full">
          <div className="w-full max-w-screen-xl px-4 sm:px-8 lg:px-16">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold my-8">
              Welcome to Kanaliiga – The World&apos;s Largest Corporate Esports
              League
            </h1>
            <p className="mb-4 text-lg">
              Founded in 2018, Kanaliiga is home to over{" "}
              <strong>2,500 players from 300+ companies</strong> annually. We
              bring professionals together through esports, cultivating positive
              gaming culture within workplaces.
            </p>
            <p className="mb-6">
              Our mission is to make esports a bridge for collaboration,
              community, and healthy competition across the business world.
            </p>

            <Separator className="bg-kanaliiga-orange my-3 md:my-6" />

            {/* Statistic Cards for All Seasons */}
            <h3 className="xs:text-2xl font-semibold mb-4">
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

            {/* CS2 Season 4 Pitch */}
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">
              🎮 CS2 Season 4 – Kicking Off This Fall
            </h2>
            <p className="text-lg mb-2">
              <strong>Registrations open June 1st – August 23rd</strong>
              <br />
              <strong>Season begins September 1st</strong>
            </p>

            <p className="mb-6">
              Get ready for the fourth installment of our most competitive and
              community-driven Counter-Strike 2 season yet. Whether you&apos;re
              returning to defend your title or joining us for the first time,{" "}
              <strong>CS2 Season 4</strong> promises intense matches, epic
              plays, and unmatched corporate camaraderie.
            </p>

            <ul className="list-disc list-inside mb-10 px-4 pb-2">
              <li>Connect with hundreds of players from top companies</li>
              <li>Build team spirit in and out of the server</li>
              <li>Compete in a professionally organized league format</li>
              <li>Appear in live-streamed broadcasts</li>
            </ul>

            <div className="text-center pb-3">
              <SignupButton />
            </div>

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
    </>
  );
}
