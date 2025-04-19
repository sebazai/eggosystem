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
import { MultiFilters } from "@/components/filters/multi-filters";
import { getParamArray, type FilterParamsQuery, cn } from "@/lib/utils";
import { useActiveSeason } from "@/hooks/data/useActiveSeason";
import { WithActiveSeason } from "@/components/filters/with-active-season";
import { usePlayerDetails } from "@/hooks/data/usePlayerDetails";
import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";

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

type SortDirection = "asc" | "desc";

export default function PlayerDetailsPage({ params }: PlayerDetailsProps) {
  const unwrappedParams = React.use(params);
  const steamId = unwrappedParams.playerId;
  const activeSeasonHook = useActiveSeason("730");
  const searchParams = useSearchParams();
  const router = useRouter();

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: SortDirection;
  }>({
    key: "match_date",
    direction: "desc"
  });

  // Get filter params from URL
  const filterParams = useMemo(() => {
    const seasons = getParamArray(searchParams, "seasons");
    const activeSeason = activeSeasonHook.activeSeason?.season_id;
    return {
      seasons:
        activeSeason && seasons.length === 0 && searchParams.size === 0
          ? [activeSeason]
          : seasons,
      leagues: getParamArray(searchParams, "leagues"),
      stages: getParamArray(searchParams, "stages"),
      teams: getParamArray(searchParams, "teams"),
      maps: getParamArray(searchParams, "maps")
    } satisfies FilterParamsQuery;
  }, [searchParams, activeSeasonHook.activeSeason?.season_id]);

  // Fetch player details using the hook
  const { playerDetails, isLoading, isError } = usePlayerDetails({
    steamId,
    ...filterParams
  });

  // Match column definitions with tooltips
  const matchColumns = useMemo(
    () => [
      {
        key: "opponent_name",
        label: "OPPONENT",
        sortable: true,
        tooltip: "Opponent Team"
      },
      { key: "score", label: "SCORE", sortable: true, tooltip: "Match Score" },
      { key: "kills", label: "K", sortable: true, tooltip: "Kills" },
      {
        key: "assists",
        label: "A (f)",
        sortable: true,
        tooltip: "Assists (Flash Assists)"
      },
      { key: "deaths", label: "D", sortable: true, tooltip: "Deaths" },
      {
        key: "awp_kills",
        label: "AWP",
        sortable: true,
        tooltip: "AWP Kills",
        responsive: false
      },
      {
        key: "utility_damage",
        label: "UD",
        sortable: true,
        tooltip: "Utility Damage",
        responsive: false
      },
      {
        key: "headshots",
        label: "HS",
        sortable: true,
        tooltip: "Headshots",
        responsive: false
      },
      {
        key: "first_kills",
        label: "FK",
        sortable: true,
        tooltip: "First Kills",
        responsive: false
      },
      {
        key: "first_deaths",
        label: "FD",
        sortable: true,
        tooltip: "First Deaths",
        responsive: false
      },
      {
        key: "adr",
        label: "ADR",
        sortable: true,
        tooltip: "Average Damage per Round",
        responsive: false
      },
      {
        key: "hs_percent",
        label: "HS%",
        sortable: true,
        tooltip: "Headshot Percentage",
        responsive: false
      },
      {
        key: "kd",
        label: "K/D",
        sortable: true,
        tooltip: "Kill/Death Ratio",
        responsive: false
      },
      {
        key: "kana_rating",
        label: "RATING",
        sortable: true,
        tooltip: "Kanaliiga Rating"
      }
    ],
    []
  );

  const handleSortClick = (key: string) => {
    let direction: SortDirection = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedMatchHistory = useMemo(() => {
    if (!playerDetails?.matchHistory || playerDetails.matchHistory.length === 0)
      return [];

    const sortableItems = [...playerDetails.matchHistory];
    sortableItems.sort((a, b) => {
      // Special case for match date
      if (sortConfig.key === "match_date") {
        const aDate = a.match_date ? new Date(a.match_date).getTime() : 0;
        const bDate = b.match_date ? new Date(b.match_date).getTime() : 0;
        return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
      }

      // Get values for the sort key
      const aValue = a[sortConfig.key as keyof typeof a];
      const bValue = b[sortConfig.key as keyof typeof b];

      // Handle special cases for strings and nulls
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Convert to numbers for comparison
      const aNum = aValue === null || aValue === undefined ? 0 : Number(aValue);
      const bNum = bValue === null || bValue === undefined ? 0 : Number(bValue);

      return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
    });

    return sortableItems;
  }, [playerDetails?.matchHistory, sortConfig]);

  if (isError) {
    return (
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
                <BreadcrumbPage>Error</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="bg-card rounded-md p-6">
          <h1 className="text-2xl font-bold text-kanaliiga-orange mb-3">
            Error Loading Player Details
          </h1>
          <p className="text-muted-foreground">
            There was an error loading the player details. Please try again
            later or adjust your filters.
          </p>
        </div>
      </div>
    );
  }

  // Use the player stats from the API if available, otherwise show loading state
  const player = playerDetails?.playerStats;
  const matchHistory = getSortedMatchHistory;

  // Calculate win percentage
  const winPercentage = player
    ? (player.wins / Math.max(player.matches_played, 1)) * 100
    : 0;

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
                <BreadcrumbPage>{player?.nickname || steamId}</BreadcrumbPage>
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
            {isLoading ? (
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-kanaliiga-light-brown/20 animate-pulse rounded-full" />
                <div className="space-y-2">
                  <div className="h-6 w-40 bg-kanaliiga-light-brown/20 animate-pulse rounded" />
                  <div className="h-4 w-20 bg-kanaliiga-light-brown/20 animate-pulse rounded" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-kanaliiga-light-brown/20 rounded-full flex items-center justify-center text-3xl font-bold">
                  {player?.nickname.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-kanaliiga-orange">
                    {player?.nickname}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Image
                      src={player?.team_logo || "/teams/nologo.svg"}
                      alt={player?.team_name || "No team"}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                    <span className="text-muted-foreground">
                      {player?.team_name || "No team"}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    <span>Steam ID: {steamId}</span>
                  </div>
                </div>
                <div className="ml-auto">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-muted-foreground text-sm">Wins</div>
                      <div className="text-lg font-semibold text-green-500">
                        {player?.wins || 0}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground text-sm">
                        Losses
                      </div>
                      <div className="text-lg font-semibold text-red-500">
                        {player?.losses || 0}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground text-sm">Win %</div>
                      <div className="text-lg font-semibold">
                        {winPercentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stat Cards Section */}
        <div className="bg-card rounded-md overflow-hidden mb-3">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-kanaliiga-orange mb-3">
              Player Statistics
            </h2>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-kanaliiga-light-brown/10 p-4 rounded-md"
                  >
                    <div className="h-4 w-16 bg-kanaliiga-light-brown/20 animate-pulse rounded mb-2" />
                    <div className="h-6 w-12 bg-kanaliiga-light-brown/20 animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Matches"
                  value={player?.matches_played?.toString() || "0"}
                />
                <StatCard
                  label="Kills"
                  value={player?.kills?.toString() || "0"}
                />
                <StatCard
                  label="Deaths"
                  value={player?.deaths?.toString() || "0"}
                />
                <StatCard
                  label="Assists"
                  value={player?.assists?.toString() || "0"}
                />
                <StatCard
                  label="K/D Ratio"
                  value={player?.kd?.toFixed(2) || "0"}
                />
                <StatCard label="ADR" value={player?.adr?.toFixed(1) || "0"} />
                <StatCard
                  label="HS%"
                  value={`${player?.hs_percent?.toFixed(1) || "0"}%`}
                />
                <StatCard
                  label="Rating"
                  value={player?.kana_rating?.toFixed(2) || "0"}
                />
              </div>
            )}
          </div>
        </div>

        {/* Player match history section with detailed statistics */}
        <div className="bg-card rounded-md overflow-hidden">
          <div className="p-4">
            <h2 className="text-xl font-semibold text-kanaliiga-orange mb-2">
              Match History
            </h2>
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="h-6 w-40 bg-kanaliiga-light-brown/20 animate-pulse rounded mx-auto mb-3" />
                  <div className="h-4 w-60 bg-kanaliiga-light-brown/20 animate-pulse rounded mx-auto" />
                </div>
              ) : matchHistory.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No match history available for this player with the current
                  filters.
                </div>
              ) : (
                <TooltipProvider>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#2a1810] text-xs uppercase">
                        {matchColumns.map((column) => (
                          <th
                            key={column.key}
                            className={cn(
                              "px-3 py-2 text-center whitespace-nowrap font-semibold text-kanaliiga-orange",
                              column.key === "opponent_name" && "text-left",
                              column.responsive === false &&
                                "hidden md:table-cell",
                              column.sortable &&
                                "cursor-pointer hover:bg-[#3a281a]"
                            )}
                            onClick={() =>
                              column.sortable && handleSortClick(column.key)
                            }
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center justify-center">
                                  <span>{column.label}</span>
                                  {column.sortable &&
                                    sortConfig.key === column.key && (
                                      <span className="inline-block ml-1">
                                        {sortConfig.direction === "asc" ? (
                                          <ChevronUp className="h-4 w-4" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4" />
                                        )}
                                      </span>
                                    )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="bg-gray-900 border border-gray-700 text-white px-2 py-1 text-xs"
                              >
                                {column.tooltip}
                              </TooltipContent>
                            </Tooltip>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-kanaliiga-light-brown/10">
                      {matchHistory.map((match) => {
                        const teamWon = match.score > match.opponent_score;

                        return (
                          <tr
                            key={`${match.match_id}`}
                            className="hover:bg-kanaliiga-light-brown/10 cursor-pointer"
                            onClick={() =>
                              router.push(`/matches/${match.match_id}`)
                            }
                          >
                            <td className="px-3 py-2 text-left">
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-muted-foreground">
                                  {match.match_date
                                    ? format(
                                        new Date(match.match_date),
                                        "dd.MM.yyyy"
                                      )
                                    : "N/A"}
                                </div>
                                <span>{match.opponent_name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {match.map_name} · {match.league_name}
                              </div>
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
                            <td className="px-3 py-2 text-center">
                              {match.kills}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {match.assists} (
                              <span className="text-xs">
                                {match.flash_assists}
                              </span>
                              )
                            </td>
                            <td className="px-3 py-2 text-center">
                              {match.deaths}
                            </td>
                            <td className="hidden md:table-cell px-3 py-2 text-center">
                              {match.awp_kills}
                            </td>
                            <td className="hidden md:table-cell px-3 py-2 text-center">
                              {match.utility_damage}
                            </td>
                            <td className="hidden md:table-cell px-3 py-2 text-center">
                              {match.headshots}
                            </td>
                            <td className="hidden md:table-cell px-3 py-2 text-center">
                              {match.first_kills}
                            </td>
                            <td className="hidden md:table-cell px-3 py-2 text-center">
                              {match.first_deaths}
                            </td>
                            <td className="hidden md:table-cell px-3 py-2 text-center">
                              {match.adr?.toFixed(1)}
                            </td>
                            <td className="hidden md:table-cell px-3 py-2 text-center">
                              {match.hs_percent?.toFixed(1)}%
                            </td>
                            <td className="hidden md:table-cell px-3 py-2 text-center">
                              {match.kd?.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-center font-bold">
                              {match.kana_rating?.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </TooltipProvider>
              )}
            </div>
            {matchHistory.length > 0 && (
              <div className="flex justify-between mt-2">
                <button className="text-muted-foreground">
                  <span className="text-kanaliiga-orange">◀</span> Previous
                </button>
                <button className="text-muted-foreground">
                  Next <span className="text-kanaliiga-orange">▶</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </WithActiveSeason>
  );
}
