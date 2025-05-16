"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { MultiFilters } from "@/components/filters/multi-filters";
import { PlayerTable } from "@/components/players/player-table";
import { PlayerNameFilter } from "@/components/filters/player-name-search";
import { useFilters } from "@/context/FilterContext";
import { CardContainer } from "@/components/layout/card-container";
import { ContentContainer } from "@/components/layout/content-container";

export const PlayersPage = () => {
  const searchParams = useSearchParams();
  const { filterParams, isLoading, error, isValidating } = useFilters();

  if (isLoading || !filterParams || isValidating)
    return <ContentContainer>Loading...</ContentContainer>;
  if (error) return <ContentContainer>Failed to load filters</ContentContainer>;

  return (
    <div>
      <h1 className="text-3xl mb-4 md:mb-8">Players</h1>
      <div className="mb-4">
        <MultiFilters {...filterParams} />

        <div className="px-1">
          <PlayerNameFilter
            initialPlayerName={searchParams.get("playerName") ?? ""}
          />
        </div>
      </div>

      <CardContainer classNames="p-2 md:p-4">
        <PlayerTable filterQueryParams={filterParams} />
      </CardContainer>
    </div>
  );
};
