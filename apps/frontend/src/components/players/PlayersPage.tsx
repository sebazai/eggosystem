"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { MultiFilters } from "@/components/filters/MultiFilters";
import { PlayerTable } from "@/components/players/PlayerTable";
import { PlayerNameFilter } from "@/components/filters/PlayerNameFilter";
import { useFilters } from "@/context/FilterContext";
import { CardContainer } from "@/components/layout/CardContainer";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { useAllMultiplePlayersStats } from "@/hooks/data/filtered/useAllMultiplePlayersStats";
import { TableSkeleton } from "@/components/loading";

export const PlayersPage = () => {
  const searchParams = useSearchParams();
  const { filterParams, isLoading, error, isValidating } = useFilters();

  const {
    players,
    isLoading: isLoadingPlayers,
    isError,
    isValidating: isValidatingPlayers
  } = useAllMultiplePlayersStats({
    ...filterParams,
    player_name: searchParams.get("playerName") ?? ""
  });

  const isFiltersLoading = isLoading || !filterParams || isValidating;
  const isPlayersLoading = isLoadingPlayers || isValidatingPlayers;

  return (
    <div>
      <h1 className="text-3xl mb-4 md:mb-8">Players</h1>
      <div className="flex flex-col mb-4 gap-4">
        {filterParams && (
          <>
            <MultiFilters
              {...filterParams}
              hideFilters={{ stages: true, maps: true }}
            />
            <PlayerNameFilter
              initialPlayerName={searchParams.get("playerName") ?? ""}
            />
          </>
        )}
        {!filterParams && (
          <div className="space-y-2">
            <div className="h-10 bg-accent animate-pulse rounded-md" />
            <div className="h-10 bg-accent animate-pulse rounded-md" />
          </div>
        )}
      </div>

      <CardContainer classNames="my-2 md:my-4">
        {(isFiltersLoading || isPlayersLoading) && (
          <TableSkeleton rows={10} columns={8} />
        )}
        {!isFiltersLoading && !isPlayersLoading && error && (
          <ContentContainer>Failed to load filters</ContentContainer>
        )}
        {!isFiltersLoading && !isPlayersLoading && !error && isError && (
          <ContentContainer>Failed to load players</ContentContainer>
        )}
        {!isFiltersLoading &&
          !isPlayersLoading &&
          !error &&
          !isError &&
          !players && (
            <ContentContainer>No players stats data found</ContentContainer>
          )}
        {!isFiltersLoading &&
          !isPlayersLoading &&
          !error &&
          !isError &&
          players && (
            <PlayerTable
              players={players}
              hideTeamName={filterParams?.seasons?.length !== 1}
            />
          )}
      </CardContainer>
    </div>
  );
};
