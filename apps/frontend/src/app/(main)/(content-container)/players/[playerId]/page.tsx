"use client";

import React from "react";
import { MultiFilters } from "@/components/filters/multi-filters";
import { PlayerDetails } from "@/components/players/player-details";
import { ContentContainer } from "@/components/layout/content-container";
import { useFilters } from "@/context/FilterContext";
import { AutoBreadcrumbs } from "@/components/layout/auto-breadcrumbs";

interface PlayerDetailsProps {
  params: Promise<{
    playerId: string;
  }>;
}

export default function PlayerDetailsPage({ params }: PlayerDetailsProps) {
  const unwrappedParams = React.use(params);
  const steamId = unwrappedParams.playerId;
  const { filterParams, isLoading, error, isValidating } = useFilters();

  if (isLoading || !filterParams || isValidating)
    return <ContentContainer>Loading...</ContentContainer>;
  if (error) return <ContentContainer>Failed to load filters</ContentContainer>;

  return (
    <div className="container mx-auto py-4">
      <div className="mb-3">
        <AutoBreadcrumbs />
      </div>

      <div className="mb-3">
        <h2 className="text-xl font-semibold mb-2">Filter Statistics</h2>
        <MultiFilters {...filterParams} steamId={steamId} />
        <PlayerDetails steamId={steamId} />
      </div>
    </div>
  );
}
