"use client";

import React from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMultiplePlayersStats } from "@/hooks/data/filtered/useMultiplePlayersStats";
import type { FilterParamsQuery } from "@/lib/utils";

interface PlayerCardsProps {
  teamId: number;
  filterQueryParams: FilterParamsQuery;
}

export const PlayerCards = ({
  teamId,
  filterQueryParams
}: PlayerCardsProps) => {
  const searchParams = useSearchParams();
  const { players, isLoading, isError } = useMultiplePlayersStats({
    ...filterQueryParams,
    teams: [Number(teamId)]
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="bg-card rounded-lg p-4 animate-pulse">
            <div className="flex justify-center mb-3">
              <div className="h-20 w-20 bg-kanaliiga-light-brown/30 rounded-full" />
            </div>
            <div className="h-4 w-24 bg-kanaliiga-light-brown/30 mx-auto rounded mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 bg-kanaliiga-light-brown/30 rounded"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError || !players) {
    return <div className="text-red-500">Failed to load player data</div>;
  }

  // Sort players by kana_rating and get top 5
  const top5Players = [...players]
    .sort((a, b) => b.kana_rating - a.kana_rating)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {top5Players.map((player) => (
        <Link
          href={`/players/${encodeURIComponent(player.steam_id)}?${searchParams.toString()}`}
          key={player.steam_id}
          className="bg-card rounded-lg p-4 transition-all hover:bg-kanaliiga-light-brown/10 cursor-pointer flex flex-col"
        >
          <div className="flex justify-center mb-3">
            {/* Player avatar */}
            <div className="w-20 h-20 bg-kanaliiga-light-brown/30 rounded-full flex items-center justify-center text-3xl text-muted-foreground">
              <User className="h-12 w-12" />
            </div>
          </div>

          <div className="flex items-center justify-center mb-2">
            {/* Player nickname */}
            <h3 className="text-center font-bold text-kanaliiga-orange truncate">
              {player.nickname.toUpperCase()}
            </h3>
          </div>

          {/* Stats */}
          <div className="space-y-1 mt-1">
            <StatRow label="Kills" value={player.kills} />
            <StatRow label="Deaths" value={player.deaths} />
            <StatRow label="K/D" value={player.kd.toFixed(2)} />
            <StatRow label="ADR" value={player.adr?.toFixed(1) || "0"} />
            <StatRow
              label="Rating"
              value={player.kana_rating?.toFixed(2) || "0"}
            />
          </div>
        </Link>
      ))}
    </div>
  );
};

const StatRow = ({
  label,
  value
}: {
  label: string;
  value: string | number;
}) => {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
};
