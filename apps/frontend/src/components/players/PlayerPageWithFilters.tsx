"use client";

import { useFilters } from "@/context/FilterContext";
import { MultiFilters } from "../filters/MultiFilters";
import { ContentContainer } from "../layout/ContentContainer";
import { PlayerDetails } from "./PlayerDetails";

export const PlayerPageWithFilters = ({ steamId }: { steamId: string }) => {
  const { filterParams, isLoading, error, isValidating } = useFilters();

  if (isLoading || !filterParams || isValidating)
    return <ContentContainer>Loading...</ContentContainer>;
  if (error) return <ContentContainer>Failed to load filters</ContentContainer>;
  return (
    <>
      <MultiFilters {...filterParams} steamId={steamId} />
      <PlayerDetails steamId={steamId} />
    </>
  );
};
