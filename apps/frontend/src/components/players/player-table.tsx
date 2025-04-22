"use client";

import React, { useMemo, useState, useEffect } from "react";
import { cn, type FilterParamsQuery } from "@/lib/utils";
import { usePlayerStats } from "@/hooks/data/usePlayersStats";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import { ContentContainer } from "@/components/layout/content-container";
import { useSearchParams, useRouter } from "next/navigation";
import type { PlayerStatsTable } from "@eggosystem/types";

interface PlayerTableProps {
  filterQueryParams: FilterParamsQuery;
}

type SortDirection = "asc" | "desc";

// Column definitions with full names for tooltips
const COLUMN_TOOLTIPS: Record<string, string> = {
  nickname: "Player Nickname",
  team_name: "Team Name",
  matches_played: "Games Played",
  kills: "Kills",
  assists: "Assists (Flash Assists)",
  deaths: "Deaths",
  awp_kills: "AWP Kills",
  utility_damage: "Utility Damage",
  headshots: "Headshots",
  first_kills: "First Kills",
  first_deaths: "First Deaths",
  adr: "Average Damage per Round",
  hs_percent: "Headshot Percentage",
  kd: "Kill/Death Ratio",
  kana_rating: "Kanaliiga Rating"
};

export const PlayerTable: React.FC<PlayerTableProps> = ({
  filterQueryParams
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const playerName = searchParams.get("playerName") ?? null;

  // Pagination state (state-only pagination to prevent scroll issues)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Get players data based on filters
  const { players, isLoading, isError, isValidating } = usePlayerStats({
    player_name: playerName || null,
    ...filterQueryParams
  });
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: SortDirection;
  }>({
    key: "kana_rating",
    direction: "desc"
  });

  // Column definitions for the table
  const columns = useMemo(
    () => [
      { key: "nickname", label: "Player", sortable: true, responsive: true },
      { key: "team_name", label: "Team", sortable: true, responsive: false },
      { key: "matches_played", label: "GP", sortable: true, responsive: false },
      { key: "kills", label: "K", sortable: true, responsive: true },
      {
        key: "assists",
        label: (
          <>
            A<span className="text-transform-none">(f)</span>
          </>
        ),
        sortable: true,
        responsive: false
      },
      { key: "deaths", label: "D", sortable: true, responsive: true },
      { key: "awp_kills", label: "AWP", sortable: true, responsive: false },
      { key: "utility_damage", label: "UD", sortable: true, responsive: false },
      { key: "headshots", label: "HS", sortable: true, responsive: false },
      { key: "first_kills", label: "FK", sortable: true, responsive: false },
      { key: "first_deaths", label: "FD", sortable: true, responsive: false },
      { key: "adr", label: "ADR", sortable: true, responsive: true },
      { key: "hs_percent", label: "HS%", sortable: true, responsive: false },
      { key: "kd", label: "K/D", sortable: true, responsive: false },
      { key: "kana_rating", label: "Rating", sortable: true, responsive: true }
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

  const getSortedPlayers = useMemo(() => {
    if (!players || players.length === 0) return [];

    const sortableItems = [...players];
    sortableItems.sort((a, b) => {
      // Get values for the sort key
      const aValue = a[sortConfig.key as keyof PlayerStatsTable];
      const bValue = b[sortConfig.key as keyof PlayerStatsTable];

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
  }, [players, sortConfig]);

  // Get current page items
  const getCurrentPageItems = useMemo(() => {
    const sorted = getSortedPlayers;
    const startIndex = (currentPage - 1) * pageSize;
    return sorted.slice(startIndex, startIndex + pageSize);
  }, [getSortedPlayers, currentPage, pageSize]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil((players?.length || 0) / pageSize);
  }, [players, pageSize]);

  // Handle page change - state only (no URL updates)
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Handle page size change - state only (no URL updates)
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page
  };

  const handleRowClick = (steamId: string) => {
    router.push(
      `/players/${encodeURIComponent(steamId)}?${searchParams.toString()}`
    );
  };

  const getTopPlayerClass = (
    index: number,
    player: PlayerStatsTable,
    sortedPlayers: PlayerStatsTable[]
  ) => {
    // Only apply top player styling if sorted by rating in descending order
    if (sortConfig.key === "kana_rating" && sortConfig.direction === "desc") {
      // Find the player's global index in the full sorted array
      const globalIndex = sortedPlayers.findIndex(
        (p) => p.steam_id === player.steam_id
      );
      if (globalIndex < 3) return "bg-[#1e1e1e] font-bold";
    }
    return "";
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterQueryParams, playerName]);

  if (isError) {
    return <ContentContainer>Error loading players data</ContentContainer>;
  }

  if (isLoading || isValidating) {
    return <ContentContainer>Loading player stats...</ContentContainer>;
  }

  if (!players) {
    return <ContentContainer>No players stats data found</ContentContainer>;
  }

  return (
    <TooltipProvider>
      <div className="bg-card rounded-sm overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#2a1810] text-xs uppercase">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-3 py-2 text-center whitespace-nowrap font-semibold text-kanaliiga-orange",
                      {
                        "cursor-pointer hover:bg-[#3a281a]": column.sortable,
                        "hidden md:table-cell": !column.responsive
                      }
                    )}
                    onClick={() =>
                      column.sortable && handleSortClick(column.key)
                    }
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-center">
                          <span>{column.label}</span>
                          {column.sortable && sortConfig.key === column.key && (
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
                        {COLUMN_TOOLTIPS[column.key] || column.key}
                      </TooltipContent>
                    </Tooltip>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 10 }).map((_, index) => (
                  <tr key={index} className="border-b border-border">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn("px-3 py-2", {
                          "hidden md:table-cell": !column.responsive
                        })}
                      >
                        <div className="h-4 w-full bg-gray-800 rounded animate-pulse"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : players.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No players found with the current filters
                  </td>
                </tr>
              ) : (
                getCurrentPageItems.map(
                  (player: PlayerStatsTable, index: number) => (
                    <tr
                      key={`${player.nickname}-${index}`}
                      className={cn(
                        "border-b border-border transition-colors",
                        getTopPlayerClass(index, player, getSortedPlayers),
                        "hover:bg-kanaliiga-light-brown/10 cursor-pointer"
                      )}
                      onClick={() => handleRowClick(player.steam_id)}
                    >
                      <td className="px-3 py-2">
                        <div
                          className={cn("font-medium text-xs", {
                            "text-white": index < 3,
                            "text-foreground": index >= 3
                          })}
                        >
                          {player.nickname}
                          <div className="text-[0.65rem] text-muted-foreground mt-1 sm:hidden">
                            {player.team_name || "No team"}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <div className="text-[0.65rem] text-muted-foreground">
                          {player.team_name || "No team"}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-muted-foreground hidden md:table-cell">
                        {player.matches_played}
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-muted-foreground">
                        {player.kills}
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-muted-foreground hidden md:table-cell">
                        {player.assists}(
                        <span className="text-[0.6rem]">
                          {player.flash_assists || 0}
                        </span>
                        )
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-muted-foreground">
                        {player.deaths}
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-muted-foreground hidden md:table-cell">
                        {player.awp_kills}
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-muted-foreground hidden md:table-cell">
                        {player.utility_damage}
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-muted-foreground hidden md:table-cell">
                        {player.headshots}
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-muted-foreground hidden md:table-cell">
                        {player.first_kills}
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-muted-foreground hidden md:table-cell">
                        {player.first_deaths}
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-muted-foreground">
                        {player.adr?.toFixed(1) || 0}
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-muted-foreground hidden md:table-cell">
                        {player.hs_percent?.toFixed(1) || 0}%
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-muted-foreground hidden md:table-cell">
                        {typeof player.kd === "number"
                          ? player.kd.toFixed(2)
                          : (player.kills / Math.max(player.deaths, 1)).toFixed(
                              2
                            )}
                      </td>
                      <td
                        className={cn("px-3 py-2 text-center text-xs", {
                          "font-bold text-white": index < 3,
                          "text-muted-foreground": index >= 3
                        })}
                      >
                        {player.kana_rating?.toFixed(2) || 0}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {players && players.length > 0 && (
          <div className="flex justify-between items-center p-3 border-t border-border">
            <div className="text-xs text-muted-foreground">
              Showing{" "}
              {Math.min((currentPage - 1) * pageSize + 1, players.length)} -{" "}
              {Math.min(currentPage * pageSize, players.length)} of{" "}
              {players.length} players
            </div>
            <div className="flex items-center gap-2">
              <button
                className={cn(
                  "px-2 py-1 text-xs rounded border border-border",
                  currentPage === 1
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "hover:bg-kanaliiga-light-brown/10"
                )}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  // Show first page, last page, current page, and pages around current
                  let pageToShow = i + 1;
                  if (totalPages > 5) {
                    if (currentPage <= 3) {
                      pageToShow = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageToShow = totalPages - 4 + i;
                    } else {
                      pageToShow = currentPage - 2 + i;
                    }
                  }

                  return (
                    <button
                      key={pageToShow}
                      className={cn(
                        "w-7 h-7 flex items-center justify-center text-xs rounded",
                        currentPage === pageToShow
                          ? "bg-kanaliiga-orange text-background"
                          : "hover:bg-kanaliiga-light-brown/10"
                      )}
                      onClick={() => handlePageChange(pageToShow)}
                    >
                      {pageToShow}
                    </button>
                  );
                })}
              </div>

              <button
                className={cn(
                  "px-2 py-1 text-xs rounded border border-border",
                  currentPage === totalPages
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "hover:bg-kanaliiga-light-brown/10"
                )}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>

              {/* Page size selector */}
              <select
                className="ml-4 px-2 py-1 text-xs bg-background border border-border rounded"
                value={pageSize}
                onChange={(e) => {
                  const newPageSize = parseInt(e.target.value);
                  handlePageSizeChange(newPageSize);
                }}
              >
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
