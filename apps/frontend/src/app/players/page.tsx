"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { MultiFilters } from "@/components/filters/multi-filters";
import { PlayerTable } from "@/components/players/player-table";
import { PlayerNameFilter } from "@/components/filters/player-name-filter";
import { useFilters } from "@/context/FilterContext";
import { TheContainer } from "@/components/layout/the-container";

export default function PlayersPage() {
  const searchParams = useSearchParams();
  const { filterParams, isLoading, error, isValidating } = useFilters();

  if (isLoading || !filterParams || isValidating)
    return <TheContainer>Loading...</TheContainer>;
  if (error) return <TheContainer>Failed to load filters</TheContainer>;

  return (
    <div className="p-0">
      {/* Filter section */}
      <div className="mb-4">
        <MultiFilters {...filterParams} />

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

          <PlayerTable filterQueryParams={filterParams} />
        </div>
      </div>
    </div>
  );
}
