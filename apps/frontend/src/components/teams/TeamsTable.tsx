import { PlayerTable } from "../players/PlayerTable";
import { TeamMatchHistory } from "./TeamMatchHistory";
import { PlayerCards } from "./PlayerCards";
import { useParams } from "next/navigation";
import { useFilters } from "@/context/FilterContext";
import { useMultiplePlayersStats } from "@/hooks/data/filtered/useMultiplePlayersStats";
import { ContentContainer } from "../layout/ContentContainer";
import { TableSkeleton, CardSkeleton } from "@/components/loading";

export const TeamsTable = () => {
  const params = useParams();
  const teamId = Number(params.teamId);
  const { filterParams } = useFilters();
  const { players, isLoading, isError, isValidating } = useMultiplePlayersStats(
    {
      ...filterParams,
      teams: [Number(teamId)]
    }
  );

  if (isError) {
    return <ContentContainer>Error loading players data</ContentContainer>;
  }

  if (isLoading || isValidating) {
    return (
      <div className="space-y-3">
        <div>
          <div className="h-6 w-32 bg-accent animate-pulse rounded mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <CardSkeleton key={index} showHeader={false} contentLines={2} />
            ))}
          </div>
        </div>
        <div className="bg-card rounded-md overflow-hidden mb-3">
          <div className="h-6 w-32 bg-accent animate-pulse rounded mb-2 p-4" />
          <div className="p-4">
            <TableSkeleton rows={5} columns={8} showHeader={false} />
          </div>
        </div>
      </div>
    );
  }

  if (!players) {
    return <ContentContainer>No players stats data found</ContentContainer>;
  }

  return (
    <div>
      {/* Top Players Cards Section - Without container background */}
      <div className="mb-3">
        <h2 className="font-semibold mb-4 text-kanaliiga-orange">
          TOP PLAYERS
        </h2>
        <PlayerCards teamId={teamId} filterQueryParams={filterParams} />
      </div>

      {/* Players Section */}
      <div className="bg-card rounded-md overflow-hidden mb-3">
        <h2 className="font-semibold mb-2">Team Players</h2>
        <PlayerTable players={players} hideTeamName={true} />
      </div>

      <TeamMatchHistory teamId={teamId} filterQueryParams={filterParams} />
    </div>
  );
};
