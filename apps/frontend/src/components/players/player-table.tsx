"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { type PlayerStats } from "@/hooks/data/usePlayers";

interface PlayerTableProps {
  players: PlayerStats[];
  isLoading: boolean;
  onPlayerClick?: (nickname: string) => void;
}

export const PlayerTable: React.FC<PlayerTableProps> = ({
  players,
  isLoading,
  onPlayerClick
}) => {
  // Column definitions for the table
  const columns = useMemo(
    () => [
      { key: "nickname", label: "Player", sortable: true },
      { key: "team_name", label: "Team", sortable: true },
      { key: "matches_played", label: "GP", sortable: true },
      { key: "kills", label: "K", sortable: true },
      { key: "assists", label: "A", sortable: true },
      { key: "deaths", label: "D", sortable: true },
      { key: "flash_assists", label: "FA", sortable: true },
      { key: "awp_kills", label: "AWP", sortable: true },
      { key: "utility_damage", label: "UD", sortable: true },
      { key: "headshots", label: "HS", sortable: true },
      { key: "first_kills", label: "FK", sortable: true },
      { key: "first_deaths", label: "FD", sortable: true },
      { key: "adr", label: "ADR", sortable: true },
      { key: "kana_rating", label: "Rating", sortable: true },
      { key: "hs_percent", label: "HS%", sortable: true },
      { key: "kd", label: "K/D", sortable: true }
    ],
    []
  );

  const handleRowClick = (nickname: string) => {
    if (onPlayerClick) {
      onPlayerClick(nickname);
    }
  };

  return (
    <div className="bg-card rounded-md overflow-hidden">
      <div className="overflow-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-kanaliiga-light-brown/20 text-xs uppercase">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left whitespace-nowrap font-semibold text-muted-foreground",
                    {
                      "text-center":
                        column.key !== "nickname" && column.key !== "team_name"
                    }
                  )}
                >
                  {column.label}
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
                    <td key={column.key} className="px-4 py-3">
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
              players.map((player: PlayerStats, index: number) => (
                <tr
                  key={`${player.nickname}-${index}`}
                  className={cn("border-b border-border transition-colors", {
                    "hover:bg-kanaliiga-light-brown/10 cursor-pointer":
                      !!onPlayerClick
                  })}
                  onClick={() =>
                    onPlayerClick && handleRowClick(player.nickname)
                  }
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{player.nickname}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {player.team_logo && (
                        <Image
                          src={player.team_logo}
                          alt={player.team_name}
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {player.team_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {player.matches_played}
                  </td>
                  <td className="px-4 py-3 text-center">{player.kills}</td>
                  <td className="px-4 py-3 text-center">{player.assists}</td>
                  <td className="px-4 py-3 text-center">{player.deaths}</td>
                  <td className="px-4 py-3 text-center">
                    {player.flash_assists}
                  </td>
                  <td className="px-4 py-3 text-center">{player.awp_kills}</td>
                  <td className="px-4 py-3 text-center">
                    {player.utility_damage}
                  </td>
                  <td className="px-4 py-3 text-center">{player.headshots}</td>
                  <td className="px-4 py-3 text-center">
                    {player.first_kills}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {player.first_deaths}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {player.adr?.toFixed(1) || 0}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {player.kana_rating?.toFixed(2) || 0}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {player.hs_percent?.toFixed(1) || 0}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    {typeof player.kd === "number"
                      ? player.kd.toFixed(2)
                      : (player.kills / Math.max(player.deaths, 1)).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
