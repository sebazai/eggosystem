import { useFilteredTeamMapStats } from "@/hooks/data/filtered/useFilteredTeamMapStats";
import type { FilterParamsQuery } from "@/lib/utils";

interface TeamMapStatsProps {
  teamId: number;
  filterQueryParams: FilterParamsQuery;
}

export const TeamMapStats = ({
  teamId,
  filterQueryParams
}: TeamMapStatsProps) => {
  const { teamMapStats, isLoading, isValidating } = useFilteredTeamMapStats({
    teamId,
    filterQueryParams
  });
  if (isLoading || isValidating || !teamMapStats) {
    // SKELETON
    return <></>;
  }
  return (
    <div className="bg-card rounded-md overflow-hidden mb-3">
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2">Map Statistics</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-kanaliiga-light-brown/20 text-xs uppercase">
                <th className="px-3 py-2 text-left whitespace-nowrap font-semibold text-muted-foreground">
                  MAP
                </th>
                <th className="px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                  PLAYED
                </th>
                <th className="px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                  WINS
                </th>
                <th className="px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                  LOSSES
                </th>
                <th className="px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                  WIN %
                </th>
                <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                  AVG SCORE
                </th>
                <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                  AVG OPP SCORE
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kanaliiga-light-brown/10">
              {teamMapStats.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-4 text-center text-muted-foreground"
                  >
                    No map statistics available
                  </td>
                </tr>
              ) : (
                teamMapStats.map((mapStat) => (
                  <tr
                    key={mapStat.map_id}
                    className="hover:bg-kanaliiga-light-brown/10"
                  >
                    <td className="px-3 py-2 text-left">{mapStat.map_name}</td>
                    <td className="px-3 py-2 text-center">
                      {mapStat.maps_played}
                    </td>
                    <td className="px-3 py-2 text-center text-green-500">
                      {mapStat.wins}
                    </td>
                    <td className="px-3 py-2 text-center text-red-500">
                      {mapStat.losses}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={
                          mapStat.win_percentage > 50
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        {mapStat.win_percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-3 py-2 text-center">
                      {mapStat.avg_score}
                    </td>
                    <td className="hidden md:table-cell px-3 py-2 text-center">
                      {mapStat.avg_opponent_score}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
