"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { MultiFilters } from "@/components/filters/multi-filters";
import { getParamArray, type FilterParamsQuery } from "@/lib/utils";
import { useActiveSeason } from "@/hooks/data/useActiveSeason";
import { WithActiveSeason } from "@/components/filters/with-active-season";

interface PlayerDetailsProps {
  params: Promise<{
    playerId: string;
  }>;
}

interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-kanaliiga-light-brown/10 p-4 rounded-md">
      <div className="text-muted-foreground text-sm">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}

export default function PlayerDetailsPage({ params }: PlayerDetailsProps) {
  const unwrappedParams = React.use(params);
  const steamId = unwrappedParams.playerId;
  const activeSeasonHook = useActiveSeason("730");
  const searchParams = useSearchParams();

  // Get filter params from URL
  const filterParams = useMemo(() => {
    const seasons = getParamArray(searchParams, "seasons");
    const activeSeason = activeSeasonHook.activeSeason?.season_id;
    return {
      seasons: activeSeason && seasons.length === 0 ? [activeSeason] : seasons,
      leagues: getParamArray(searchParams, "leagues"),
      stages: getParamArray(searchParams, "stages"),
      teams: getParamArray(searchParams, "teams"),
      maps: getParamArray(searchParams, "maps")
    } satisfies FilterParamsQuery;
  }, [searchParams, activeSeasonHook.activeSeason?.season_id]);

  // This would be replaced with actual data fetching in the future
  const playerData = {
    steamId: steamId,
    nickname: ".VILLE",
    team_name: "Example Team",
    team_logo: "/teams/nologo.svg",
    matches_played: 17,
    kills: 253,
    deaths: 252,
    assists: 95,
    flash_assists: 22,
    awp_kills: 12,
    utility_damage: 1245,
    headshots: 131,
    first_kills: 30,
    first_deaths: 25,
    kd: 1.0,
    adr: 80.1,
    hs_percent: 51.8,
    kana_rating: 1.05,
    wins: 15,
    losses: 10,
    win_percentage: 60.0,
    kast: 65.4,
    impact: 1.25,
    rounds_played: 468,
    clutches_won: 12,
    clutches_lost: 15,
    clutch_percentage: 44.4,
    entry_success: 52.3,
    traded_percentage: 21.8,
    multikills: {
      "2k": 42,
      "3k": 18,
      "4k": 6,
      "5k": 1
    }
  };

  // Mock data for player matches
  const playerMatches = [
    {
      id: "1",
      team: "Praecopium",
      score: 15,
      opponent_score: 19,
      opponent: "Crocot",
      season: "CS2 Season 3",
      league: "div6",
      date: "2.4.2025",
      map: "Anubis",
      kills: 41,
      assists: 8
    },
    {
      id: "2",
      team: "Praecopium",
      score: 8,
      opponent_score: 13,
      opponent: "Crocot",
      season: "CS2 Season 3",
      league: "div6",
      date: "2.4.2025",
      map: "Ancient",
      kills: 21,
      assists: 3
    },
    {
      id: "3",
      team: "Praecopium",
      score: 5,
      opponent_score: 13,
      opponent: "Produal",
      season: "CS2 Season 3",
      league: "div6",
      date: "18.3.2025",
      map: "Inferno",
      kills: 12,
      assists: 4
    },
    {
      id: "4",
      team: "Praecopium",
      score: 8,
      opponent_score: 13,
      opponent: "Produal",
      season: "CS2 Season 3",
      league: "div6",
      date: "18.3.2025",
      map: "Dust2",
      kills: 17,
      assists: 1
    },
    {
      id: "5",
      team: "Praecopium",
      score: 16,
      opponent_score: 12,
      opponent: "HYVAKS X-Men",
      season: "CS2 Season 3",
      league: "div6",
      date: "13.3.2025",
      map: "Mirage",
      kills: 34,
      assists: 7
    }
  ];

  return (
    <WithActiveSeason>
      <div className="container mx-auto py-4">
        <div className="mb-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/players">Players</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{playerData.nickname}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="mb-3">
          <h2 className="text-xl font-semibold text-kanaliiga-orange mb-2">
            Filter Statistics
          </h2>
          <MultiFilters
            seasons={filterParams.seasons}
            leagues={filterParams.leagues}
            stages={filterParams.stages}
            teams={filterParams.teams}
            maps={filterParams.maps}
          />
        </div>

        <div className="bg-card rounded-md overflow-hidden mb-3">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-kanaliiga-light-brown/20 rounded-full flex items-center justify-center text-3xl font-bold">
                {playerData.nickname.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-kanaliiga-orange">
                  {playerData.nickname}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Image
                    src={playerData.team_logo}
                    alt={playerData.team_name}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                  <span className="text-muted-foreground">
                    {playerData.team_name}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  <span>Steam ID: {playerData.steamId}</span>
                </div>
              </div>
              <div className="ml-auto">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-muted-foreground text-sm">Wins</div>
                    <div className="text-lg font-semibold text-green-500">
                      {playerData.wins}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground text-sm">Losses</div>
                    <div className="text-lg font-semibold text-red-500">
                      {playerData.losses}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground text-sm">Win %</div>
                    <div className="text-lg font-semibold">
                      {playerData.win_percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Cards Section */}
        <div className="bg-card rounded-md overflow-hidden mb-3">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-kanaliiga-orange mb-3">
              Player Statistics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Matches"
                value={playerData.matches_played.toString()}
              />
              <StatCard label="Kills" value={playerData.kills.toString()} />
              <StatCard label="Deaths" value={playerData.deaths.toString()} />
              <StatCard label="Assists" value={playerData.assists.toString()} />
              <StatCard label="K/D Ratio" value={playerData.kd.toFixed(2)} />
              <StatCard label="ADR" value={playerData.adr.toFixed(1)} />
              <StatCard
                label="HS%"
                value={`${playerData.hs_percent.toFixed(1)}%`}
              />
              <StatCard
                label="Rating"
                value={playerData.kana_rating.toFixed(2)}
              />
            </div>
          </div>
        </div>

        {/* Player match history section with detailed statistics */}
        <div className="bg-card rounded-md overflow-hidden">
          <div className="p-4">
            <h2 className="text-xl font-semibold text-kanaliiga-orange mb-2">
              Match History
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-kanaliiga-light-brown/20 text-xs uppercase">
                    <th className="px-3 py-2 text-left whitespace-nowrap font-semibold text-muted-foreground">
                      OPPONENT
                    </th>
                    <th className="px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      SCORE
                    </th>
                    <th className="px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      K
                    </th>
                    <th className="px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      A (f)
                    </th>
                    <th className="px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      D
                    </th>
                    <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      AWP
                    </th>
                    <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      UD
                    </th>
                    <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      HS
                    </th>
                    <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      FK
                    </th>
                    <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      FD
                    </th>
                    <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      ADR
                    </th>
                    <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      HS%
                    </th>
                    <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      K/D
                    </th>
                    <th className="px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      RATING
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kanaliiga-light-brown/10">
                  {playerMatches.map((match) => {
                    const teamWon = match.score > match.opponent_score;
                    // Calculate mock stats for each match
                    const mockDeaths = Math.round(match.kills * 0.7);
                    const mockRating = (
                      (match.kills * 0.8 + match.assists * 0.2) /
                      20
                    ).toFixed(2);
                    const mockFA = Math.round(match.assists * 0.3);
                    const mockAWP = Math.round(match.kills * 0.05);
                    const mockUD = Math.round(match.kills * 10);
                    const mockHS = Math.round(match.kills * 0.45);
                    const mockFK = Math.round(match.kills * 0.1);
                    const mockFD = Math.round(match.kills * 0.08);
                    const mockADR = (match.kills * 2).toFixed(1);
                    const mockHSPercent = Math.round(
                      (mockHS / match.kills) * 100
                    ).toFixed(1);
                    const mockKD = (
                      match.kills / Math.max(mockDeaths, 1)
                    ).toFixed(2);

                    return (
                      <tr
                        key={match.id}
                        className="hover:bg-kanaliiga-light-brown/10 cursor-pointer"
                        onClick={() => console.log(`Clicked match ${match.id}`)}
                      >
                        <td className="px-3 py-2 text-left">
                          {match.opponent}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={
                              teamWon ? "text-green-500" : "text-red-500"
                            }
                          >
                            {match.score}
                          </span>
                          -
                          <span
                            className={
                              !teamWon ? "text-green-500" : "text-red-500"
                            }
                          >
                            {match.opponent_score}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">{match.kills}</td>
                        <td className="px-3 py-2 text-center">
                          {match.assists} ({mockFA})
                        </td>
                        <td className="px-3 py-2 text-center">{mockDeaths}</td>
                        <td className="hidden md:table-cell px-3 py-2 text-center">
                          {mockAWP}
                        </td>
                        <td className="hidden md:table-cell px-3 py-2 text-center">
                          {mockUD}
                        </td>
                        <td className="hidden md:table-cell px-3 py-2 text-center">
                          {mockHS}
                        </td>
                        <td className="hidden md:table-cell px-3 py-2 text-center">
                          {mockFK}
                        </td>
                        <td className="hidden md:table-cell px-3 py-2 text-center">
                          {mockFD}
                        </td>
                        <td className="hidden md:table-cell px-3 py-2 text-center">
                          {mockADR}
                        </td>
                        <td className="hidden md:table-cell px-3 py-2 text-center">
                          {mockHSPercent}%
                        </td>
                        <td className="hidden md:table-cell px-3 py-2 text-center">
                          {mockKD}
                        </td>
                        <td className="px-3 py-2 text-center font-bold">
                          {mockRating}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between mt-2">
              <button className="text-muted-foreground">
                <span className="text-kanaliiga-orange">◀</span> Previous
              </button>
              <button className="text-muted-foreground">
                Next <span className="text-kanaliiga-orange">▶</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </WithActiveSeason>
  );
}
