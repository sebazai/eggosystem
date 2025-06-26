import { PlayerTable } from "../players/PlayerTable";
import { TeamMatchHistory } from "./TeamMatchHistory";
import { PlayerCards } from "./PlayerCards";
import { useParams } from "next/navigation";
import { useFilters } from "@/context/FilterContext";

export const TeamsTable = () => {
  const params = useParams();
  const teamId = Number(params.teamId);
  const { filterParams } = useFilters();
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
        <PlayerTable
          filterQueryParams={{
            ...filterParams,
            teams: [Number(teamId)]
          }}
          initialPageSize={10}
        />
      </div>

      <TeamMatchHistory teamId={teamId} filterQueryParams={filterParams} />
    </div>
  );
};
