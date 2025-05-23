import { createTeamLogoUrl, type FilterParamsQuery } from "@/lib/utils";

import { PlayerTable } from "../players/player-table";
import { ContentContainer } from "@/components/layout/content-container";
import { TeamMatchHistory } from "./team-match-history";
import { TeamMapStats } from "./team-map-stats";
import { TeamWinLossDetails } from "./team-win-loss";
import { useFilteredTeamById } from "@/hooks/data/filtered/useFilteredTeamById";
import { NextImageFallback } from "../layout/image-with-fallback";

interface TeamTableProps {
  filterQueryParams: FilterParamsQuery;
  teamId: number;
}

export const TeamsTable = ({ filterQueryParams, teamId }: TeamTableProps) => {
  const { team, isLoading, error } = useFilteredTeamById({
    teamId,
    filterQueryParams
  });

  if (error) {
    return <ContentContainer>Error loading team details</ContentContainer>;
  }

  if (isLoading) {
    return (
      <ContentContainer>
        <div className="animate-pulse flex flex-col space-y-6">
          <div className="h-8 w-40 bg-gray-800 rounded"></div>
          <div className="h-24 w-full bg-gray-800 rounded"></div>
          <div className="h-64 w-full bg-gray-800 rounded"></div>
        </div>
      </ContentContainer>
    );
  }

  if (!team) {
    return <ContentContainer>Team not found</ContentContainer>;
  }

  return (
    <div>
      {/* Team Header */}
      <div className="bg-card rounded-md overflow-hidden mb-3">
        <div className="p-3 sm:p-6 border-b border-border">
          <div className="flex items-center gap-2 sm:gap-4">
            <NextImageFallback
              src={createTeamLogoUrl(team.team_logo)}
              alt={team.name}
              width={80}
              height={80}
              className="rounded-full h-15 w-15 sm:h-25 sm:w-25"
            />
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-kanaliiga-orange">
                {team.name}
              </h1>
              <div className="flex sm:flex-row flex-col sm:items-center gap-1 sm:gap-2 mt-1">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {team.latest_season_name}
                </span>
                <span className="hidden sm:block text-muted-foreground">•</span>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {team.latest_league_name}
                </span>
              </div>
            </div>
            <div className="ml-auto">
              <TeamWinLossDetails
                teamId={teamId}
                filterQueryParams={filterQueryParams}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Map statistics section */}
      <TeamMapStats teamId={teamId} filterQueryParams={filterQueryParams} />
      {/* Players Section */}
      <div className="bg-card rounded-md overflow-hidden mb-3">
        <div className="p-4">
          <h2 className="font-semibold mb-2">Team Players</h2>
          <PlayerTable
            filterQueryParams={{
              ...filterQueryParams,
              teams: [Number(teamId)]
            }}
            initialPageSize={10}
          />
        </div>
      </div>
      <TeamMatchHistory teamId={teamId} filterQueryParams={filterQueryParams} />
    </div>
  );
};
