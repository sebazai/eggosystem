"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  cn,
  filterParamsToSearchParams,
  type FilterParamsQuery
} from "@/lib/utils";
import { useMultiplePlayersStats } from "@/hooks/data/filtered/useMultiplePlayersStats";
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
import { TablePagination } from "../tables/table-pagination";

interface PlayerTableProps {
  filterQueryParams: FilterParamsQuery;
  initialPageSize?: number;
}

type SortDirection = "asc" | "desc";

// Column definitions with full names for tooltips
const COLUMN_TOOLTIPS: Record<string, string> = {
  nickname: "Player Nickname",
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
  filterQueryParams,
  initialPageSize
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const playerName = searchParams.get("playerName") ?? null;

  // Pagination state (state-only pagination to prevent scroll issues)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize ?? 20);

  // Get players data based on filters
  const { players, isLoading, isError, isValidating } = useMultiplePlayersStats(
    {
      player_name: playerName || null,
      ...filterQueryParams
    }
  );
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
      {
        key: "nickname",
        label: "Player",
        sortable: true,
        responsive: ""
      },
      {
        key: "matches_played",
        label: "Maps Played",
        sortable: true,
        responsive: "hidden md:table-cell"
      },
      {
        key: "kills",
        label: "K",
        sortable: true,
        responsive: ""
      },
      {
        key: "assists",
        label: (
          <>
            A<span className="text-transform-none">(f)</span>
          </>
        ),
        sortable: true,
        responsive: "hidden sm:table-cell"
      },
      {
        key: "deaths",
        label: "D",
        sortable: true,
        responsive: ""
      },
      {
        key: "awp_kills",
        label: "AWP",
        sortable: true,
        responsive: "hidden md:table-cell"
      },
      {
        key: "utility_damage",
        label: "UD",
        sortable: true,
        responsive: "hidden lg:table-cell"
      },
      {
        key: "headshots",
        label: "HS",
        sortable: true,
        responsive: "hidden sm:table-cell"
      },
      {
        key: "first_kills",
        label: "FK",
        sortable: true,
        responsive: "hidden lg:table-cell"
      },
      {
        key: "first_deaths",
        label: "FD",
        sortable: true,
        responsive: "hidden lg:table-cell"
      },
      {
        key: "adr",
        label: "ADR",
        sortable: true,
        responsive: ""
      },
      {
        key: "hs_percent",
        label: "HS%",
        sortable: true,
        responsive: "hidden md:table-cell"
      },
      {
        key: "kd",
        label: "K/D",
        sortable: true,
        responsive: "hidden md:table-cell"
      },
      {
        key: "kana_rating",
        label: "Rating",
        sortable: true,
        responsive: ""
      }
    ],
    []
  );

  const columnResponsive = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        if (column.responsive) {
          acc[column.key] = column.responsive;
        }
        return acc;
      },
      {} as Record<string, string>
    );
  }, [columns]);

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
      `/players/${encodeURIComponent(steamId)}?${filterParamsToSearchParams(filterQueryParams).toString()}`
    );
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
      <div className="bg-card overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-kanaliiga-light-brown/30 text-xs uppercase text-kanaliiga-orange">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-3 py-2 text-center whitespace-nowrap font-semibold",
                      {
                        "cursor-pointer hover:bg-kanaliiga-orange/50":
                          column.sortable
                      },
                      column.responsive
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
                      <TooltipContent side="top" className="px-2 py-1 text-xs">
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
                        className={cn("px-3 py-2", column.responsive)}
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
                      className="border-b border-border h-10 transition-colors hover:bg-kanaliiga-light-brown/10 cursor-pointer"
                      onClick={() => handleRowClick(player.steam_id)}
                    >
                      <td
                        className={cn("px-3 py-2", columnResponsive.nickname)}
                      >
                        <div className="font-medium text-xs text-foreground">
                          {player.nickname}
                        </div>
                      </td>
                      <TableDataCell
                        responsive={columnResponsive.matches_played}
                      >
                        {player.maps_played}
                      </TableDataCell>
                      <TableDataCell responsive={columnResponsive.kills}>
                        {player.kills}
                      </TableDataCell>
                      <TableDataCell responsive={columnResponsive.assists}>
                        {player.assists}(
                        <span className="text-[0.6rem]">
                          {player.flash_assists || 0}
                        </span>
                        )
                      </TableDataCell>
                      <TableDataCell responsive={columnResponsive.deaths}>
                        {player.deaths}
                      </TableDataCell>
                      <TableDataCell responsive={columnResponsive.awp_kills}>
                        {player.awp_kills}
                      </TableDataCell>
                      <TableDataCell
                        responsive={columnResponsive.utility_damage}
                      >
                        {player.utility_damage}
                      </TableDataCell>
                      <TableDataCell responsive={columnResponsive.headshots}>
                        {player.headshots}
                      </TableDataCell>
                      <TableDataCell responsive={columnResponsive.first_kills}>
                        {player.first_kills}
                      </TableDataCell>
                      <TableDataCell responsive={columnResponsive.first_deaths}>
                        {player.first_deaths}
                      </TableDataCell>
                      <TableDataCell responsive={columnResponsive.adr}>
                        {player.adr?.toFixed(1) || 0}
                      </TableDataCell>
                      <TableDataCell responsive={columnResponsive.hs_percent}>
                        {player.hs_percent?.toFixed(1) || 0}%
                      </TableDataCell>
                      <TableDataCell responsive={columnResponsive.kd}>
                        {typeof player.kd === "number"
                          ? player.kd.toFixed(2)
                          : (player.kills / Math.max(player.deaths, 1)).toFixed(
                              2
                            )}
                      </TableDataCell>
                      <TableDataCell
                        classNames="px-3 py-2 text-center text-xs text-muted-foreground"
                        responsive={columnResponsive.kana_rating}
                      >
                        {player.kana_rating?.toFixed(2) || 0}
                      </TableDataCell>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        {players && players.length > (initialPageSize ?? 0) && (
          <TablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalRows={players.length}
            totalPages={totalPages}
            handlePageSizeChange={handlePageSizeChange}
            handlePageChange={handlePageChange}
            type="players"
          />
        )}
      </div>
    </TooltipProvider>
  );
};

const TableDataCell = ({
  children,
  responsive,
  classNames
}: {
  children: React.ReactNode;
  responsive?: string;
  classNames?: string;
}) => {
  return (
    <td
      className={cn(
        "px-3 py-2 text-center text-xs text-muted-foreground",
        responsive,
        classNames
      )}
    >
      {children}
    </td>
  );
};
