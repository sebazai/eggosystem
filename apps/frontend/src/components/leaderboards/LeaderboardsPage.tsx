"use client";

import React from "react";
import { MultiFilters } from "@/components/filters/MultiFilters";

import { LeaderboardsGrid } from "@/components/leaderboards/LeaderboardsGrid";

import { useFilters } from "@/context/FilterContext";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { CardContainer } from "@/components/layout/CardContainer";

export const LeaderboardsPage = () => {
  const { filterParams, isLoading, error, isValidating, areFiltersEmpty } =
    useFilters();

  if (error) return <ContentContainer>Failed to load filters</ContentContainer>;
  if (isLoading || !filterParams || isValidating)
    return <ContentContainer>Loading...</ContentContainer>;

  return (
    <div>
      <h1 className="text-3xl mb-4">Leaderboards</h1>
      <p className="text-sm text-gray-500">
        At least 3 maps must be played to be eligible for the leaderboard.
      </p>
      <div className="pb-2">
        <MultiFilters {...filterParams} />
      </div>
      <CardContainer classNames="p-2 md:p-4">
        {areFiltersEmpty ? (
          <ContentContainer classNames="min-h-[30vh]">
            Please select one filter.
          </ContentContainer>
        ) : (
          <LeaderboardsGrid filterQueryParams={filterParams} />
        )}
      </CardContainer>
    </div>
  );
};
