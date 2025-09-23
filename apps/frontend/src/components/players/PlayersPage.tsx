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

  if (isLoading || !filterParams || isValidating)
    return <ContentContainer>Loading...</ContentContainer>;
  if (error) return <ContentContainer>Failed to load filters</ContentContainer>;

  if (isLoadingPlayers || isValidatingPlayers)
    return <ContentContainer>Loading...</ContentContainer>;
  if (isError)
    return <ContentContainer>Failed to load players</ContentContainer>;

  if (!players) {
    return <ContentContainer>No players stats data found</ContentContainer>;
  }

  return (
    <div>
      <h1 className="text-3xl mb-4 md:mb-8">Players</h1>
      <div className="flex flex-col mb-4 gap-4">
        <MultiFilters
          {...filterParams}
          hideFilters={{ stages: true, maps: true }}
        />
        <PlayerNameFilter
          initialPlayerName={searchParams.get("playerName") ?? ""}
        />
      </div>

      <CardContainer classNames="my-2 md:my-4">
        <PlayerTable
          players={players}
          hideTeamName={filterParams.seasons?.length !== 1}
        />
      </CardContainer>
    </div>
  );
};
