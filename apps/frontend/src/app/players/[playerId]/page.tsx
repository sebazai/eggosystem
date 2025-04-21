"use client";

import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { MultiFilters } from "@/components/filters/multi-filters";
import { PlayerDetails } from "@/components/players/player-details";
import { ContentContainer } from "@/components/layout/content-container";
import { useFilters } from "@/context/FilterContext";

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
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/players">Players</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{steamId}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mb-3">
        <h2 className="text-xl font-semibold text-kanaliiga-orange mb-2">
          Filter Statistics
        </h2>
        <MultiFilters {...filterParams} steamId={steamId} />
        <PlayerDetails steamId={steamId} filterParams={filterParams} />
      </div>
    </div>
  );
}
