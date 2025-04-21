"use client";

import React, { useMemo, useState } from "react";
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
      { key: "team_name", label: "Team", sortable: true, responsive: true },
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

  const handleRowClick = (steamId: string) => {
    router.push(
      `/players/${encodeURIComponent(steamId)}?${searchParams.toString()}`
    );
  };

  const getTopPlayerClass = (index: number) => {
    if (index < 3) return "bg-[#1e1e1e] font-bold";
    return "";
  };

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
                      "px-4 py-3 text-center whitespace-nowrap font-semibold text-kanaliiga-orange",
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
                        className={cn("px-4 py-3", {
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
                getSortedPlayers.map(
                  (player: PlayerStatsTable, index: number) => (
                    <tr
                      key={`${player.nickname}-${index}`}
                      className={cn(
                        "border-b border-border transition-colors",
                        getTopPlayerClass(index),
                        "hover:bg-kanaliiga-light-brown/10 cursor-pointer"
                      )}
                      onClick={() => handleRowClick(player.steam_id)}
                    >
                      <td className="px-4 py-3">
                        <div
                          className={cn("font-medium", {
                            "text-white": index < 3,
                            "text-foreground": index >= 3
                          })}
                        >
                          {player.nickname}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {player.team_name || "No team"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground hidden md:table-cell">
                        {player.matches_played}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {player.kills}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground hidden md:table-cell">
                        {player.assists}(
                        <span className="text-xs">
                          {player.flash_assists || 0}
                        </span>
                        )
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {player.deaths}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground hidden md:table-cell">
                        {player.awp_kills}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground hidden md:table-cell">
                        {player.utility_damage}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground hidden md:table-cell">
                        {player.headshots}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground hidden md:table-cell">
                        {player.first_kills}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground hidden md:table-cell">
                        {player.first_deaths}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {player.adr?.toFixed(1) || 0}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground hidden md:table-cell">
                        {player.hs_percent?.toFixed(1) || 0}%
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground hidden md:table-cell">
                        {typeof player.kd === "number"
                          ? player.kd.toFixed(2)
                          : (player.kills / Math.max(player.deaths, 1)).toFixed(
                              2
                            )}
                      </td>
                      <td
                        className={cn("px-4 py-3 text-center", {
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
      </div>
    </TooltipProvider>
  );
};
