"use client";

import React, { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import { useSearchParams, useRouter } from "next/navigation";
import type { PlayerStatsTable } from "@eggosystem/types";
import { TablePagination } from "../tables/TablePagination";

interface PlayerTableProps {
  players: PlayerStatsTable[];
  initialPageSize?: number;
}

type SortDirection = "asc" | "desc";

// Column definitions with full names for tooltips
const COLUMN_TOOLTIPS: Record<string, string> = {
  nickname: "Player Nickname",
  maps_played: "Number of Maps Played",
  kills: "Total Kills",
  assists: "Total Assists (Flash Assists in parentheses)",
  deaths: "Total Deaths",
  awp_kills: "AWP Kills",
  utility_damage: "Utility Damage",
  headshots: "Headshots",
  first_kills: "First Kills",
  first_deaths: "First Deaths",
  adr: "Average Damage per Round",
  hs_percent: "Headshot Percentage",
  kd: "Kill/Death Ratio",
  kana_rating: "Kanarating"
};

export const PlayerTable: React.FC<PlayerTableProps> = ({
  players,
  initialPageSize
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: SortDirection;
  }>({
    key: "kana_rating",
    direction: "desc"
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize || 10);

  // Get player name from URL params
  const playerName = searchParams.get("playerName") || "";

  // Filter players by name if search param exists
  const filteredPlayers = useMemo(() => {
    if (!players) return [];
    if (!playerName) return players;

    return players.filter((player) =>
      player.nickname.toLowerCase().includes(playerName.toLowerCase())
    );
  }, [players, playerName]);

  // Sort players based on current sort configuration
  const sortedPlayers = useMemo(() => {
    if (!filteredPlayers) return [];

    return [...filteredPlayers].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof PlayerStatsTable];
      const bValue = b[sortConfig.key as keyof PlayerStatsTable];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Handle numeric values
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      // Handle string values
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }, [filteredPlayers, sortConfig]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedPlayers.length / pageSize);
  const getCurrentPageItems = sortedPlayers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Column definitions with responsive classes
  const columns = useMemo(
    () => [
      {
        key: "nickname",
        label: "PLAYER",
        sortable: true,
        responsive: "table-cell"
      },
      {
        key: "maps_played",
        label: "MAPS",
        sortable: true,
        responsive: "hidden md:table-cell"
      },
      { key: "kills", label: "K", sortable: true, responsive: "table-cell" },
      {
        key: "assists",
        label: "A (F)",
        sortable: true,
        responsive: "hidden lg:table-cell"
      },
      { key: "deaths", label: "D", sortable: true, responsive: "table-cell" },
      {
        key: "awp_kills",
        label: "AWP",
        sortable: true,
        responsive: "hidden xl:table-cell"
      },
      {
        key: "utility_damage",
        label: "UD",
        sortable: true,
        responsive: "hidden xl:table-cell"
      },
      {
        key: "headshots",
        label: "HS",
        sortable: true,
        responsive: "hidden lg:table-cell"
      },
      {
        key: "first_kills",
        label: "FK",
        sortable: true,
        responsive: "hidden xl:table-cell"
      },
      {
        key: "first_deaths",
        label: "FD",
        sortable: true,
        responsive: "hidden xl:table-cell"
      },
      {
        key: "adr",
        label: "ADR",
        sortable: true,
        responsive: "hidden md:table-cell"
      },
      {
        key: "hs_percent",
        label: "HS%",
        sortable: true,
        responsive: "hidden lg:table-cell"
      },
      {
        key: "kd",
        label: "K/D",
        sortable: true,
        responsive: "hidden md:table-cell"
      },
      {
        key: "kana_rating",
        label: "RATING",
        sortable: true,
        responsive: "table-cell"
      }
    ],
    []
  );

  const columnResponsive = {
    nickname: "table-cell",
    matches_played: "hidden md:table-cell",
    kills: "table-cell",
    assists: "hidden lg:table-cell",
    deaths: "table-cell",
    awp_kills: "hidden xl:table-cell",
    utility_damage: "hidden xl:table-cell",
    headshots: "hidden lg:table-cell",
    first_kills: "hidden xl:table-cell",
    first_deaths: "hidden xl:table-cell",
    adr: "hidden md:table-cell",
    hs_percent: "hidden lg:table-cell",
    kd: "hidden md:table-cell",
    kana_rating: "table-cell"
  };

  const handleSortClick = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const handlePageChange = (page: number) => {
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

  // Reset pagination when players and playerName changers
  useEffect(() => {
    setCurrentPage(1);
  }, [players, playerName]);

  return (
    <TooltipProvider>
      <div className="bg-card overflow-hidden">
        <div className="overflow-auto">
          <table className="text-sm sm:text-base w-full">
            <thead>
              <tr className="bg-kanaliiga-light-brown/30 uppercase text-kanaliiga-orange">
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
                      <TooltipContent side="top" className="px-2 py-1">
                        {COLUMN_TOOLTIPS[column.key] || column.key}
                      </TooltipContent>
                    </Tooltip>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {getCurrentPageItems.map(
                (player: PlayerStatsTable, index: number) => (
                  <tr
                    key={`${player.nickname}-${index}`}
                    className="border-b border-border h-10 transition-colors hover:bg-kanaliiga-light-brown/10 cursor-pointer"
                    onClick={() => handleRowClick(player.steam_id)}
                    onMouseDown={(e) => {
                      // Handle middle mouse button (wheel) click
                      if (e.button === 1) {
                        e.preventDefault(); // Prevent scroll behavior
                        const url = `/players/${encodeURIComponent(player.steam_id)}?${searchParams.toString()}`;
                        window.open(url, "_blank");
                      }
                    }}
                  >
                    <td className={cn("px-3 py-2", columnResponsive.nickname)}>
                      <div className="font-medium text-foreground">
                        {player.nickname}
                      </div>
                    </td>
                    <TableDataCell responsive={columnResponsive.matches_played}>
                      {player.maps_played}
                    </TableDataCell>
                    <TableDataCell responsive={columnResponsive.kills}>
                      {player.kills}
                    </TableDataCell>
                    <TableDataCell responsive={columnResponsive.assists}>
                      {player.assists}(
                      <span className="text-xs">
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
                    <TableDataCell responsive={columnResponsive.utility_damage}>
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
                      classNames="px-3 py-2 text-center text-muted-foreground"
                      responsive={columnResponsive.kana_rating}
                    >
                      {player.kana_rating?.toFixed(2) || 0}
                    </TableDataCell>
                  </tr>
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
    <td className={cn("px-3 py-2 text-center", responsive, classNames)}>
      {children}
    </td>
  );
};
