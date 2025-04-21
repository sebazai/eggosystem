"use client";

import React from "react";
import { MultiFilters } from "@/components/filters/multi-filters";

import { LeaderboardsGrid } from "@/components/leaderboards/leaderboards-grid";

import { useFilters } from "@/context/FilterContext";
import { ContentContainer } from "@/components/layout/content-container";
import { CardContainer } from "@/components/layout/card-container";

export default function LeaderboardsPage() {
  const { filterParams, isLoading, error, isValidating } = useFilters();

  if (isLoading || !filterParams || isValidating)
    return <ContentContainer>Loading...</ContentContainer>;
  if (error) return <ContentContainer>Failed to load filters</ContentContainer>;

  return (
    <div>
      <MultiFilters {...filterParams} />
      <CardContainer classNames="p-2 md:p-4">
        <LeaderboardsGrid filterQueryParams={filterParams} />
      </CardContainer>
    </div>
  );
}
