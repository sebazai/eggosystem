"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { usePlayerStats } from "@/hooks/data/filtered/usePlayerStats";
import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import { TablePagination } from "../tables/table-pagination";
import { usePlayerMatchHistory } from "@/hooks/data/filtered/usePlayerMatchHistory";
import { PlayerDetailsHeader } from "./player-details-header";
import { useFilters } from "@/context/FilterContext";

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
}

export const PlayerDetails = ({ steamId }: PlayerDetailsProps) => {
  const router = useRouter();

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: SortDirection;
  }>({
    key: "match_date",
    direction: "desc"
  });

  const { filterParams } = useFilters();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch player details using the hook
  const { playerStats, isLoading, isError } = usePlayerStats({
    steamId,
    ...filterParams
  });

  const { matchHistory } = usePlayerMatchHistory({
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
        key: "season",
        label: "SEASON",
        sortable: true,
        tooltip: "Season",
        responsive: false
      },
      {
        key: "map_league",
        label: "MAPS/LEAGUE",
        sortable: false,
        tooltip: "Map and League",
        responsive: false
      },
      {
        key: "score",
        label: "SCORE",
        sortable: true,
        tooltip: "Match Score (Opponent score on right)"
      },
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
    if (!matchHistory || matchHistory.length === 0) return [];

    const sortableItems = [...matchHistory];
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
  }, [matchHistory, sortConfig]);

  // Calculate pagination
  const totalMatches = getSortedMatchHistory.length;
  const totalPages = Math.ceil(totalMatches / itemsPerPage);
  const paginatedMatches = getSortedMatchHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle page size change - state only (no URL updates)
  const handlePageSizeChange = (newPageSize: number) => {
    setItemsPerPage(newPageSize);
    setCurrentPage(1); // Reset to first page
  };

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
      <PlayerDetailsHeader steamId={steamId} />
      {/* Stat Cards Section */}
      <div className="bg-card rounded-md overflow-hidden mb-3">
        <div className="p-3 sm:p-6">
          <h2 className="text-xl font-semibold mb-3">Player Statistics</h2>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-kanaliiga-light-brown/10 p-4 rounded-md"
                >
                  <div className="h-4 w-16 bg-kanaliiga-light-brown/30 animate-pulse rounded mb-2" />
                  <div className="h-6 w-12 bg-kanaliiga-light-brown/30 animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Maps played"
                value={playerStats?.maps_played?.toString() || "0"}
              />
              <StatCard
                label="Kills"
                value={playerStats?.kills?.toString() || "0"}
              />
              <StatCard
                label="Deaths"
                value={playerStats?.deaths?.toString() || "0"}
              />
              <StatCard
                label="Assists"
                value={playerStats?.assists?.toString() || "0"}
              />
              <StatCard
                label="K/D Ratio"
                value={playerStats?.kd?.toFixed(2) || "0"}
              />
              <StatCard
                label="ADR"
                value={playerStats?.adr?.toFixed(1) || "0"}
              />
              <StatCard
                label="HS%"
                value={`${playerStats?.hs_percent?.toFixed(1) || "0"}%`}
              />
              <StatCard
                label="Rating"
                value={playerStats?.kana_rating?.toFixed(2) || "0"}
              />
            </div>
          )}
        </div>
      </div>

      {/* Player match history section with detailed statistics */}
      <div className="bg-card rounded-md overflow-hidden">
        <div className="p-3 sm:p-6">
          <h2 className="text-xl font-semibold mb-2">Match History</h2>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-3 sm:p-6 text-center">
                <div className="h-6 w-40 bg-kanaliiga-light-brown/30 animate-pulse rounded mx-auto mb-3" />
                <div className="h-4 w-60 bg-kanaliiga-light-brown/30 animate-pulse rounded mx-auto" />
              </div>
            ) : matchHistory?.length === 0 ? (
              <div className="p-3 sm:p-6 text-center text-muted-foreground">
                No match history available for this player with the current
                filters.
              </div>
            ) : (
              <TooltipProvider>
                <table className="w-full">
                  <thead>
                    {/* Desktop headers */}
                    <tr className="hidden bg-kanaliiga-light-brown/30 sm:table-row text-xs uppercase text-kanaliiga-orange">
                      {matchColumns.map((column) => (
                        <th
                          key={column.key}
                          className={cn(
                            "px-3 py-2 text-center whitespace-nowrap font-semibold",
                            column.key === "opponent_name" && "text-left",
                            column.responsive === false &&
                              "hidden md:table-cell",
                            column.sortable &&
                              "cursor-pointer hover:bg-kanaliiga-orange/50"
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
                              className="px-2 py-1 text-xs"
                            >
                              {column.tooltip}
                            </TooltipContent>
                          </Tooltip>
                        </th>
                      ))}
                    </tr>

                    {/* Mobile headers */}
                    <tr className="sm:hidden bg-kanaliiga-light-brown/30 text-xs uppercase text-kanaliiga-orange">
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

                          <td className="hidden md:table-cell px-3 py-2 text-center text-xs text-muted-foreground">
                            {match.season_name}
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
          {totalMatches > 10 && (
            <TablePagination
              totalRows={totalMatches}
              currentPage={currentPage}
              totalPages={totalPages}
              handlePageChange={setCurrentPage}
              handlePageSizeChange={handlePageSizeChange}
              pageSize={itemsPerPage}
              type="matches"
            />
          )}
        </div>
      </div>
    </div>
  );
};
