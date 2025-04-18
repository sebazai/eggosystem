"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import {
  getParamArray,
  type FilterParamsQuery,
  createStatsKanaliigaImageUrl
} from "@/lib/utils";
import { useTeamDetails } from "@/hooks/data/useTeamDetails";
import { MultiFilters } from "@/components/filters/multi-filters";
import { TheContainer } from "@/components/layout/the-container";
import { useActiveSeason } from "@/hooks/data/useActiveSeason";
import { WithActiveSeason } from "@/components/filters/with-active-season";
import { PlayerTable } from "@/components/players/player-table";
import { usePlayers } from "@/hooks/data/usePlayers";
import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";

interface TeamDetailsPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default function TeamDetailsPage({ params }: TeamDetailsPageProps) {
  const unwrappedParams = React.use(params);
  const teamId = unwrappedParams.teamId;
  const activeSeasonHook = useActiveSeason("730");
  const searchParams = useSearchParams();
  const router = useRouter();

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "date",
    direction: "desc"
  });

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
  const {
    teamDetails,
    isLoading: isTeamLoading,
    error
  } = useTeamDetails({
    teamId: Number(teamId),
    map_ids: filterParams.maps.length ? filterParams.maps : null
  });

  // Get players for the team using the usePlayers hook
  const { players, isLoading: isPlayersLoading } = usePlayers({
    season_ids: filterParams.seasons.length ? filterParams.seasons : null,
    league_ids: filterParams.leagues.length ? filterParams.leagues : null,
    team_ids: [parseInt(teamId)],
    stages: filterParams.stages.length ? filterParams.stages : null,
    map_ids: filterParams.maps.length ? filterParams.maps : null
  });

  const handlePlayerClick = (steamId: string) => {
    router.push(`/players/${steamId}`);
  };

  // Sort the matches
  const sortedMatches = useMemo(() => {
    if (!teamDetails?.matches || teamDetails.matches.length === 0) return [];

    return [...teamDetails.matches].sort((a, b) => {
      if (sortConfig.key === "date") {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
      }

      // Handle other sort keys if needed
      return 0;
    });
  }, [teamDetails?.matches, sortConfig]);

  const handleSortClick = (key: string) => {
    let direction: "asc" | "desc" = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  if (error) {
    return <TheContainer>Error loading team details</TheContainer>;
  }

  if (isTeamLoading) {
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

  const { team, map_stats } = teamDetails;

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
                src={createStatsKanaliigaImageUrl(team.team_logo)}
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
                    <div className="text-muted-foreground text-sm">Games</div>
                    <div className="text-lg font-semibold">
                      {team.matches_played}
                    </div>
                  </div>
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
                  {(map_stats || []).length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-4 text-center text-muted-foreground"
                      >
                        No map statistics available
                      </td>
                    </tr>
                  ) : (
                    (map_stats || []).map((mapStat) => (
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
                    ))
                  )}
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
            <PlayerTable
              players={players}
              isLoading={isPlayersLoading}
              onPlayerClick={handlePlayerClick}
            />
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
                  <tr className="bg-[#2a1810] text-xs uppercase">
                    <th className="px-3 py-2 text-left whitespace-nowrap font-semibold text-kanaliiga-orange">
                      <div
                        className="flex items-center cursor-pointer hover:bg-[#3a281a]"
                        onClick={() => handleSortClick("date")}
                      >
                        OPPONENT
                        {sortConfig.key === "date" && (
                          <span className="ml-1">
                            {sortConfig.direction === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-center whitespace-nowrap font-semibold text-kanaliiga-orange">
                      SCORE
                    </th>
                    <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold text-kanaliiga-orange">
                      MAP
                    </th>
                    <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold text-kanaliiga-orange">
                      DATE
                    </th>
                    <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold text-kanaliiga-orange">
                      RESULT
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kanaliiga-light-brown/10">
                  {isTeamLoading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-8 text-center text-gray-400"
                      >
                        Loading matches...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-red-500">
                        Error loading match data.
                      </td>
                    </tr>
                  ) : sortedMatches && sortedMatches.length > 0 ? (
                    sortedMatches.map((match) => {
                      const teamWon = match.result === "win";
                      const formattedDate = format(
                        new Date(match.date),
                        "dd.MM.yyyy"
                      );

                      return (
                        <tr
                          key={match.match_id}
                          className="hover:bg-kanaliiga-light-brown/10 cursor-pointer"
                          onClick={() =>
                            router.push(`/matches/${match.match_id}`)
                          }
                        >
                          <td className="px-3 py-2 text-left">
                            <div className="flex items-center gap-2">
                              <Image
                                src={createStatsKanaliigaImageUrl(
                                  match.opponent_logo
                                )}
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
                            {match.maps}
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
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-8 text-center text-gray-400"
                      >
                        No matches found for this team.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </WithActiveSeason>
  );
}
