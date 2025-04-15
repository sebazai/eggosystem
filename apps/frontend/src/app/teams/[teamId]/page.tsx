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
import { getParamArray, type FilterParamsQuery } from "@/lib/utils";
import { useTeamDetails } from "@/hooks/data/useTeamDetails";
import { MultiFilters } from "@/components/filters/multi-filters";
import { TheContainer } from "@/components/layout/the-container";
import { useActiveSeason } from "@/hooks/data/useActiveSeason";
import { WithActiveSeason } from "@/components/filters/with-active-season";

interface TeamDetailsPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

interface StatCardProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function StatCard({ label, value, highlight = false }: StatCardProps) {
  return (
    <div className="bg-kanaliiga-light-brown/10 p-4 rounded-md">
      <div className="text-muted-foreground text-sm">{label}</div>
      <div
        className={`text-xl font-semibold mt-1 ${highlight ? "text-kanaliiga-orange" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

export default function TeamDetailsPage({ params }: TeamDetailsPageProps) {
  const unwrappedParams = React.use(params);
  const teamId = unwrappedParams.teamId;
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
      teams: null,
      maps: getParamArray(searchParams, "maps")
    } satisfies FilterParamsQuery;
  }, [searchParams, activeSeasonHook.activeSeason?.season_id]);

  // Get team details
  const { teamDetails, isLoading, error } = useTeamDetails({
    teamId,
    map_ids: filterParams.maps.length ? filterParams.maps : null
  });

  if (error) {
    return <TheContainer>Error loading team details</TheContainer>;
  }

  if (isLoading) {
    return (
      <TheContainer>
        <div className="animate-pulse flex flex-col space-y-6">
          <div className="h-8 w-40 bg-gray-800 rounded"></div>
          <div className="h-24 w-full bg-gray-800 rounded"></div>
          <div className="h-64 w-full bg-gray-800 rounded"></div>
        </div>
      </TheContainer>
    );
  }

  if (!teamDetails) {
    return <TheContainer>Team not found</TheContainer>;
  }

  const { team, players, matches } = teamDetails;

  // Mock data for map statistics
  const teamMapStats = [
    {
      map_id: 1,
      map_name: "Dust2",
      matches_played: 5,
      wins: 3,
      losses: 2,
      win_percentage: 60.0,
      avg_score: "14.2",
      avg_opponent_score: "12.6",
      avg_rating: "1.08"
    },
    {
      map_id: 2,
      map_name: "Inferno",
      matches_played: 4,
      wins: 4,
      losses: 0,
      win_percentage: 100.0,
      avg_score: "16.0",
      avg_opponent_score: "8.3",
      avg_rating: "1.22"
    },
    {
      map_id: 3,
      map_name: "Mirage",
      matches_played: 3,
      wins: 1,
      losses: 2,
      win_percentage: 33.3,
      avg_score: "11.3",
      avg_opponent_score: "13.7",
      avg_rating: "0.94"
    },
    {
      map_id: 6,
      map_name: "Anubis",
      matches_played: 2,
      wins: 2,
      losses: 0,
      win_percentage: 100.0,
      avg_score: "16.0",
      avg_opponent_score: "9.0",
      avg_rating: "1.18"
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
                <BreadcrumbLink href="/teams">Teams</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{team.name}</BreadcrumbPage>
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
            teams={null}
            maps={filterParams.maps}
          />
        </div>

        {/* Team Header */}
        <div className="bg-card rounded-md overflow-hidden mb-3">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-4">
              <Image
                src={team.team_logo}
                alt={team.name}
                width={80}
                height={80}
                className="rounded-full"
              />
              <div>
                <h1 className="text-2xl font-bold text-kanaliiga-orange">
                  {team.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-muted-foreground">
                    {team.league_name}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    {team.season_name}
                  </span>
                </div>
              </div>
              <div className="ml-auto">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-muted-foreground text-sm">Wins</div>
                    <div className="text-lg font-semibold text-green-500">
                      {team.wins}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground text-sm">Losses</div>
                    <div className="text-lg font-semibold text-red-500">
                      {team.losses}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground text-sm">Win %</div>
                    <div className="text-lg font-semibold">
                      {team.win_percentage.toFixed(1)}%
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
              Team Statistics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Matches"
                value={team.matches_played.toString()}
              />
              <StatCard label="Wins" value={team.wins.toString()} />
              <StatCard label="Losses" value={team.losses.toString()} />
              <StatCard
                label="Win %"
                value={`${team.win_percentage.toFixed(1)}%`}
                highlight={team.win_percentage > 50}
              />
            </div>
          </div>
        </div>

        {/* Map statistics section */}
        <div className="bg-card rounded-md overflow-hidden mb-3">
          <div className="p-4">
            <h2 className="text-xl font-semibold text-kanaliiga-orange mb-2">
              Map Statistics
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-kanaliiga-light-brown/20 text-xs uppercase">
                    <th className="px-3 py-2 text-left whitespace-nowrap font-semibold text-muted-foreground">
                      MAP
                    </th>
                    <th className="px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      PLAYED
                    </th>
                    <th className="px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      WINS
                    </th>
                    <th className="px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      LOSSES
                    </th>
                    <th className="px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      WIN %
                    </th>
                    <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      AVG SCORE
                    </th>
                    <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      AVG OPP
                    </th>
                    <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      AVG RATING
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kanaliiga-light-brown/10">
                  {teamMapStats.map((mapStat) => (
                    <tr
                      key={mapStat.map_id}
                      className="hover:bg-kanaliiga-light-brown/10"
                    >
                      <td className="px-3 py-2 text-left">
                        {mapStat.map_name}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {mapStat.matches_played}
                      </td>
                      <td className="px-3 py-2 text-center text-green-500">
                        {mapStat.wins}
                      </td>
                      <td className="px-3 py-2 text-center text-red-500">
                        {mapStat.losses}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={
                            mapStat.win_percentage > 50
                              ? "text-green-500"
                              : "text-red-500"
                          }
                        >
                          {mapStat.win_percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-3 py-2 text-center">
                        {mapStat.avg_score}
                      </td>
                      <td className="hidden md:table-cell px-3 py-2 text-center">
                        {mapStat.avg_opponent_score}
                      </td>
                      <td className="hidden md:table-cell px-3 py-2 text-center font-bold">
                        {mapStat.avg_rating}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Players Section */}
        <div className="bg-card rounded-md overflow-hidden mb-3">
          <div className="p-4">
            <h2 className="text-xl font-semibold text-kanaliiga-orange mb-2">
              Team Players
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-kanaliiga-light-brown/20 text-xs uppercase">
                    <th className="px-3 py-2 text-left whitespace-nowrap font-semibold text-muted-foreground">
                      PLAYER
                    </th>
                    <th className="px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      GP
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
                  {players.map((player, index) => (
                    <tr
                      key={`${player.nickname}-${index}`}
                      className="hover:bg-kanaliiga-light-brown/10 cursor-pointer"
                      onClick={() =>
                        console.log(`Clicked player ${player.nickname}`)
                      }
                    >
                      <td className="px-3 py-2 text-left">
                        <div className="font-medium">{player.nickname}</div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {player.matches_played}
                      </td>
                      <td className="px-3 py-2 text-center">{player.kills}</td>
                      <td className="px-3 py-2 text-center">
                        {player.assists} ({player.flash_assists})
                      </td>
                      <td className="px-3 py-2 text-center">{player.deaths}</td>
                      <td className="hidden md:table-cell px-3 py-2 text-center">
                        {player.awp_kills}
                      </td>
                      <td className="hidden md:table-cell px-3 py-2 text-center">
                        {player.headshots}
                      </td>
                      <td className="hidden md:table-cell px-3 py-2 text-center">
                        {player.first_kills}
                      </td>
                      <td className="hidden md:table-cell px-3 py-2 text-center">
                        {player.first_deaths}
                      </td>
                      <td className="hidden md:table-cell px-3 py-2 text-center">
                        {player.adr?.toFixed(1) || "0.0"}
                      </td>
                      <td className="hidden md:table-cell px-3 py-2 text-center">
                        {player.hs_percent?.toFixed(1) || "0.0"}%
                      </td>
                      <td className="hidden md:table-cell px-3 py-2 text-center">
                        {player.kd?.toFixed(2) || "0.00"}
                      </td>
                      <td className="px-3 py-2 text-center font-bold">
                        {player.kana_rating?.toFixed(2) || "0.00"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Team match history section */}
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
                    <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      MAP
                    </th>
                    <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      DATE
                    </th>
                    <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                      RESULT
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kanaliiga-light-brown/10">
                  {matches.map((match) => {
                    const teamWon = match.team_score > match.opponent_score;
                    const formattedDate = new Date(
                      match.date
                    ).toLocaleDateString();

                    return (
                      <tr
                        key={match.id}
                        className="hover:bg-kanaliiga-light-brown/10 cursor-pointer"
                        onClick={() => console.log(`Clicked match ${match.id}`)}
                      >
                        <td className="px-3 py-2 text-left">
                          <div className="flex items-center gap-2">
                            <Image
                              src={match.opponent_logo}
                              alt={match.opponent_name}
                              width={20}
                              height={20}
                              className="rounded-full"
                            />
                            {match.opponent_name}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={
                              teamWon ? "text-green-500" : "text-red-500"
                            }
                          >
                            {match.team_score}
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
                        <td className="hidden md:table-cell px-3 py-2 text-center">
                          {match.map_name}
                        </td>
                        <td className="hidden md:table-cell px-3 py-2 text-center">
                          {formattedDate}
                        </td>
                        <td className="hidden md:table-cell px-3 py-2 text-center">
                          <span
                            className={
                              match.result === "win"
                                ? "text-green-500"
                                : match.result === "loss"
                                  ? "text-red-500"
                                  : "text-yellow-500"
                            }
                          >
                            {match.result.toUpperCase()}
                          </span>
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
