import { useTopTeams } from "@/hooks/data/filtered/useTopTeams";
import { type FilterParamsQuery } from "@/lib/utils";
import { StatsGrid } from "../grids/stats-grid";
import { StatsGridRow } from "../grids/stats-grid-row";

const getLeagueEmoji = (priority: number) =>
  priority === 1 ? "👑" : priority === 2 ? "🏆" : priority === 3 ? "⭐" : "🎮";

const getStageType = (stage: number) =>
  stage === 1 ? "Regular" : stage === 2 ? "Playoffs" : "Regular";

const getRankEmoji = (rank: number) => {
  return rank === 1 ? "👑" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
};

interface TopTeamsGridProps {
  filterQueryParams: FilterParamsQuery;
}

export const TopTeamsGrid = ({ filterQueryParams }: TopTeamsGridProps) => {
  const { divisions, isLoading, isError, isValidating } =
    useTopTeams(filterQueryParams);

  return (
    <StatsGrid
      data={divisions}
      isLoading={isLoading || isValidating}
      isError={isError}
      testId="top-teams-grid"
      emptyMessage="No top teams found"
      renderHeader={(division) => (
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {getLeagueEmoji(division.league_sort_priority)}
          </span>
          <h2 className="text-xl font-bold">
            {`${division.league_name}, ${getStageType(division.stage)}`}
          </h2>
        </div>
      )}
      renderRow={(division) =>
        division.teams.map((team, index) => (
          <StatsGridRow
            key={index}
            linkUrl={`/teams/${team.team_id}`}
            placement={getRankEmoji(index + 1)}
            teamLogo={team.team_logo}
            teamName={team.team_name}
            columnOneText={team.team_name}
            mapsPlayed={team.matches_played}
            value={team.kana.toFixed(2)}
            playerIndex={index}
          />
        ))
      }
    />
  );
};
