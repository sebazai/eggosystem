"use client";

import React from "react";
import Link from "next/link";
import { useFilteredTeams } from "@/hooks/data/filtered/useFilteredTeams";
import { createTeamLogoUrl, type FilterParamsQuery } from "@/lib/utils";
import { ContentContainer } from "../layout/ContentContainer";
import type { TeamStats } from "@eggosystem/types";
import { NextImageFallback } from "../layout/NextImageFallback";
import { useFilters } from "@/context/FilterContext";
import { TeamCardSkeleton } from "../loading";

interface TeamsGridProps {
  filterQueryParams: FilterParamsQuery;
}

export const TeamsGrid = ({ filterQueryParams }: TeamsGridProps) => {
  // Get teams data based on filters
  const { getFilteredQueryString } = useFilters();
  const { teams, isLoading, error } = useFilteredTeams(filterQueryParams);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <TeamCardSkeleton count={6} />
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <ContentContainer>
        No teams found with the current filters
      </ContentContainer>
    );
  }

  if (error) {
    return <ContentContainer>Error fetching teams</ContentContainer>;
  }

  const paramsWithoutTeams = getFilteredQueryString(["teams"]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {teams.map((team, index) => (
        <TeamCard key={index} team={team} queryParams={paramsWithoutTeams} />
      ))}
    </div>
  );
};

const TeamCard: React.FC<{
  team: TeamStats;
  queryParams: string;
}> = ({ team, queryParams }) => {
  const logoUrl = createTeamLogoUrl(team.team_logo);
  const winPercentage = Math.min(team.win_percentage, 100);
  return (
    <Link
      href={{ pathname: `/teams/${team.id}`, query: queryParams }}
      className="block bg-card rounded-md overflow-hidden hover:bg-kanaliiga-light-brown/10 transition-colors"
    >
      <div className="bg-kanaliiga-light-brown/30 p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <NextImageFallback
            src={logoUrl}
            alt={`${team.name} logo`}
            width={60}
            height={60}
            className="object-contain"
          />
          <div>
            <h3 className="text-lg font-bold">{team.name}</h3>
            <p className="text-sm text-muted-foreground">
              {team.latest_season_name} {team.latest_league_name}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-3 gap-4">
          <StatBox label="Matches" value={team.matches_played.toString()} />
          <StatBox label="Record" value={`${team.wins}/${team.losses}`} />
          <StatBox
            label="Win %"
            value={`${winPercentage.toFixed(1)}%`}
            highlight={winPercentage > 50}
          />
        </div>
      </div>
    </Link>
  );
};

const StatBox: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
}> = ({ label, value, highlight = false }) => {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-lg font-semibold ${highlight ? "text-kanaliiga-orange" : ""}`}
      >
        {value}
      </p>
    </div>
  );
};
