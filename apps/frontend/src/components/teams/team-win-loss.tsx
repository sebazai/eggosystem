import { useFilteredTeamByIdDetails } from "@/hooks/data/filtered/useFilteredTeamDetails";
import type { FilterParamsQuery } from "@/lib/utils";
interface TeamWinLossDetailsProps {
  teamId: number;
  filterQueryParams: FilterParamsQuery;
}

export const TeamWinLossDetails = ({
  teamId,
  filterQueryParams
}: TeamWinLossDetailsProps) => {
  const { teamDetails: team } = useFilteredTeamByIdDetails({
    teamId,
    filterQueryParams
  });
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="text-center">
        <div className="text-muted-foreground text-sm">MP</div>
        <div className="text-lg font-semibold">{team?.matches_played ?? 0}</div>
      </div>
      <div className="text-center">
        <div className="text-muted-foreground text-sm">W</div>
        <div className="text-lg font-semibold text-green-500">
          {team?.wins ?? 0}
        </div>
      </div>
      <div className="text-center">
        <div className="text-muted-foreground text-sm">L</div>
        <div className="text-lg font-semibold text-red-500">
          {team?.losses ?? 0}
        </div>
      </div>
      <div className="text-center">
        <div className="text-muted-foreground text-sm">Win%</div>
        <div className="text-lg font-semibold">
          {(team?.win_percentage ?? 0).toFixed(1)}%
        </div>
      </div>
    </div>
  );
};
