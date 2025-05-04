import { useLeaderboards } from "@/hooks/data/useLeaderboards";
import { type FilterParamsQuery } from "@/lib/utils";
import { StatsGrid } from "../grids/stats-grid";
import { StatsGridRow } from "../grids/stats-grid-row";

interface LeaderboardsGridProps {
  filterQueryParams: FilterParamsQuery;
}

const formatValue = (value: number, unit: string): string => {
  if (unit === "%") return value.toFixed(2);
  if (unit === "s") return value.toFixed(0);
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(2);
};

const getPlacementLogoText = (index: number) => {
  return index === 1
    ? "👑"
    : index === 2
      ? "🥈"
      : index === 3
        ? "🥉"
        : `#${index}`;
};

export const LeaderboardsGrid = ({
  filterQueryParams
}: LeaderboardsGridProps) => {
  const { leaderboards, isLoading, isError, isValidating } =
    useLeaderboards(filterQueryParams);

  return (
    <StatsGrid
      data={leaderboards}
      isLoading={isLoading || isValidating}
      isError={isError}
      testId="leaderboards-grid"
      emptyMessage="No leaderboard data available for the selected filters."
      renderHeader={(category) => <h2>{category.title}</h2>}
      renderRow={(category) =>
        category.players?.length ? (
          category.players.map((player, index) => (
            <StatsGridRow
              key={index}
              linkUrl={`/players/${player.steam_id}`}
              placement={getPlacementLogoText(player.rank)}
              columnOneText={player.nickname}
              columnTwoText={player.team_name}
              mapsPlayed={player.matches_played}
              value={formatValue(player.value, category.unit)}
              unit={category.unit}
            />
          ))
        ) : (
          <p className="text-muted-foreground text-center py-4">
            No data available for this category
          </p>
        )
      }
    />
  );
};
