"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { MultiFilters } from "@/components/filters/multi-filters";
import { useActiveSeason } from "@/hooks/data/useActiveSeason";
import { PlayerTable } from "@/components/players/player-table";
import { WithActiveSeason } from "@/components/filters/with-active-season";
import { PlayerNameFilter } from "@/components/filters/player-name-filter";
import { TheContainer } from "@/components/layout/the-container";

export default function PlayersPage() {
  const searchParams = useSearchParams();
  const activeSeasonHook = useActiveSeason("730");

  if (!activeSeasonHook.filterParams) {
    return <TheContainer>Fetching active season...</TheContainer>;
  }

  return (
    <WithActiveSeason>
      <div className="p-0">
        {/* Filter section */}
        <div className="mb-4">
          <MultiFilters {...activeSeasonHook.filterParams} />

          <div className="px-1">
            <PlayerNameFilter
              initialPlayerName={searchParams.get("playerName") ?? ""}
            />
          </div>
        </div>

        <div className="min-h-fit pb-8 px-4 bg-card">
          <div className="max-w-[1400px] mx-auto">
            <h1 className="text-kanaliiga-orange text-3xl font-bold py-8">
              Players
            </h1>

            <PlayerTable filterQueryParams={activeSeasonHook.filterParams} />
          </div>
        </div>
      </div>
    </WithActiveSeason>
  );
}
