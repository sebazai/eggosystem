import { PlayerTable } from "../players/PlayerTable";
import { TeamMatchHistory } from "./TeamMatchHistory";
import { PlayerCards } from "./PlayerCards";
import { useParams } from "next/navigation";
import { useFilters } from "@/context/FilterContext";
import { useMultiplePlayersStats } from "@/hooks/data/filtered/useMultiplePlayersStats";
import { ContentContainer } from "../layout/ContentContainer";

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
    return <ContentContainer>Loading player stats...</ContentContainer>;
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
        <PlayerTable players={players} initialPageSize={10} />
      </div>

      <TeamMatchHistory teamId={teamId} filterQueryParams={filterParams} />
    </div>
  );
};
