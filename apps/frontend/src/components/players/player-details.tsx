"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { cn, type FilterParamsQuery } from "@/lib/utils";
import { usePlayerDetails } from "@/hooks/data/usePlayerDetails";
import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import { FaceITLevelIcon } from "../profle/faceit-level";
import { CS2PremierRankBadge } from "../profle/cs2-premier-rank";
import { useFaceITRank } from "@/hooks/data/useFaceITRank";
import { useCS2PremierRank } from "@/hooks/data/useCS2PremierRank";

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-kanaliiga-light-brown/10 p-4 rounded-md">
      <div className="text-muted-foreground text-sm">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}
interface StatCardProps {
  label: string;
  value: string;
}
type SortDirection = "asc" | "desc";

interface PlayerDetailsProps {
  steamId: string;
  filterParams: FilterParamsQuery;
}

export const PlayerDetails = ({
  steamId,
  filterParams
}: PlayerDetailsProps) => {
  const router = useRouter();
  const faceItRank = useFaceITRank(steamId);
  const cs2PremierRank = useCS2PremierRank(steamId);

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: SortDirection;
  }>({
    key: "match_date",
    direction: "desc"
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

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
      {
        key: "match_date",
        label: "DATE",
        sortable: true,
        tooltip: "Match Date",
        responsive: false
      },
      {
        key: "map_league",
        label: "MAP/LEAGUE",
        sortable: false,
        tooltip: "Map and League",
        responsive: false
      },
      { key: "score", label: "SCORE", sortable: true, tooltip: "Match Score" },
      { key: "kills", label: "K", sortable: true, tooltip: "Kills" },
      {
        key: "assists",
        label: "A (f)",
        sortable: true,
        tooltip: "Assists (Flash Assists)",
        responsive: false
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
        tooltip: "Average Damage per Round"
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

  const matchHistory = getSortedMatchHistory;

  // Calculate pagination
  const totalMatches = matchHistory.length;
  const totalPages = Math.ceil(totalMatches / itemsPerPage);
  const paginatedMatches = matchHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Use the player stats from the API if available, otherwise show loading state
  const player = playerDetails?.playerStats;

  // Calculate win percentage
  const winPercentage = player
    ? (player.wins / Math.max(player.matches_played, 1)) * 100
    : 0;

  if (isError) {
    return (
      <div className="container mx-auto py-4">
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

  return (
    <div>
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
                  {/* Add rank indicators here */}
                  <div className="flex items-center gap-2">
                    {faceItRank.isLoading || cs2PremierRank.isLoading ? (
                      <div className="flex gap-1">
                        <div className="w-5 h-5 rounded-full bg-kanaliiga-light-brown/20 animate-pulse"></div>
                        <div className="w-5 h-5 rounded-full bg-kanaliiga-light-brown/20 animate-pulse"></div>
                      </div>
                    ) : (
                      <>
                        {faceItRank.faceItRank?.faceit_level ? (
                          <FaceITLevelIcon
                            level={faceItRank.faceItRank.faceit_level}
                          />
                        ) : null}
                        {cs2PremierRank.cs2Rank?.rank ? (
                          <CS2PremierRankBadge
                            rankScore={cs2PremierRank.cs2Rank.rank}
                          />
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
                {/* Team info on a new row */}
                <div className="flex items-center gap-2 mt-1">
                  {player?.team_name &&
                  playerDetails?.matchHistory?.[0]?.team_id ? (
                    <Link
                      href={`/teams/${playerDetails.matchHistory[0].team_id}`}
                      className="flex items-center gap-2 hover:text-kanaliiga-orange transition-colors"
                    >
                      <Image
                        src={player?.team_logo || "/teams/nologo.svg"}
                        alt={player?.team_name || "No team"}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                      <span className="text-muted-foreground">
                        {player?.team_name}
                      </span>
                    </Link>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>
              <div className="ml-auto">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-muted-foreground text-sm">W</div>
                    <div className="text-lg font-semibold text-green-500">
                      {player?.wins || 0}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground text-sm">L</div>
                    <div className="text-lg font-semibold text-red-500">
                      {player?.losses || 0}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground text-sm">Win%</div>
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
                    {/* Desktop headers */}
                    <tr className="hidden sm:table-row bg-[#2a1810] text-xs uppercase">
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

                    {/* Mobile headers */}
                    <tr className="sm:hidden bg-[#2a1810] text-xs uppercase">
                      <th className="px-3 py-2 text-left whitespace-nowrap font-semibold text-kanaliiga-orange">
                        OPPONENT
                      </th>
                      <th className="px-3 py-2 text-center whitespace-nowrap font-semibold text-kanaliiga-orange">
                        K
                      </th>
                      <th className="px-3 py-2 text-center whitespace-nowrap font-semibold text-kanaliiga-orange">
                        D
                      </th>
                      <th className="px-3 py-2 text-center whitespace-nowrap font-semibold text-kanaliiga-orange">
                        ADR
                      </th>
                      <th className="px-3 py-2 text-center whitespace-nowrap font-semibold text-kanaliiga-orange">
                        RATING
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-kanaliiga-light-brown/10">
                    {paginatedMatches.map((match) => {
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
                            <span>{match.opponent_name}</span>
                            {/* Score on mobile - hidden on desktop */}
                            <div className="sm:hidden text-xs mt-1">
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
                            </div>
                          </td>

                          {/* Date - hidden on mobile */}
                          <td className="hidden md:table-cell px-3 py-2 text-center text-xs text-muted-foreground">
                            {match.match_date
                              ? format(new Date(match.match_date), "dd.MM.yyyy")
                              : "N/A"}
                          </td>

                          {/* Map & League - hidden on mobile */}
                          <td className="hidden md:table-cell px-3 py-2 text-center text-xs text-muted-foreground">
                            {match.map_name} • {match.league_name}
                          </td>

                          {/* Score - hidden on mobile, shown on desktop */}
                          <td className="hidden sm:table-cell px-3 py-2 text-center">
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
                          <td className="hidden md:table-cell px-3 py-2 text-center">
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
                          <td className="px-3 py-2 text-center">
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
            <div className="flex justify-between mt-2 items-center">
              <div className="text-sm text-muted-foreground">
                Showing {paginatedMatches.length} of {totalMatches} matches
              </div>
              <div className="flex gap-2">
                <button
                  className={`text-muted-foreground ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:text-kanaliiga-orange"}`}
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <span className="text-kanaliiga-orange">◀</span> Previous
                </button>
                <span className="text-muted-foreground px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className={`text-muted-foreground ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:text-kanaliiga-orange"}`}
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next <span className="text-kanaliiga-orange">▶</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
