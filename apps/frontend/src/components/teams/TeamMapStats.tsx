import { useFilteredTeamMapStats } from "@/hooks/data/filtered/useFilteredTeamMapStats";
import { mapToReadableName, type FilterParamsQuery } from "@/lib/utils";

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
    // Show skeleton loader instead of empty fragment
    return (
      <div className="bg-card rounded-md overflow-hidden mb-3 animate-pulse">
        <div className="p-4">
          <div className="h-7 bg-gray-800 rounded w-1/3 mb-4"></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-3 py-2">
                    <div className="h-5 bg-gray-800 rounded w-20"></div>
                  </th>
                  <th className="px-3 py-2">
                    <div className="h-5 bg-gray-800 rounded w-16 mx-auto"></div>
                  </th>
                  <th className="px-3 py-2">
                    <div className="h-5 bg-gray-800 rounded w-16 mx-auto"></div>
                  </th>
                  <th className="px-3 py-2">
                    <div className="h-5 bg-gray-800 rounded w-16 mx-auto"></div>
                  </th>
                  <th className="px-3 py-2">
                    <div className="h-5 bg-gray-800 rounded w-16 mx-auto"></div>
                  </th>
                  <th className="hidden md:table-cell px-3 py-2">
                    <div className="h-5 bg-gray-800 rounded w-16 mx-auto"></div>
                  </th>
                  <th className="hidden md:table-cell px-3 py-2">
                    <div className="h-5 bg-gray-800 rounded w-16 mx-auto"></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">
                      <div className="h-5 bg-gray-800 rounded w-24"></div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="h-5 bg-gray-800 rounded w-10 mx-auto"></div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="h-5 bg-gray-800 rounded w-10 mx-auto"></div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="h-5 bg-gray-800 rounded w-10 mx-auto"></div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="h-5 bg-gray-800 rounded w-16 mx-auto"></div>
                    </td>
                    <td className="hidden md:table-cell px-3 py-2">
                      <div className="h-5 bg-gray-800 rounded w-10 mx-auto"></div>
                    </td>
                    <td className="hidden md:table-cell px-3 py-2">
                      <div className="h-5 bg-gray-800 rounded w-10 mx-auto"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-card rounded-md overflow-hidden mb-3">
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2">Map Statistics</h2>
        <div className="overflow-x-auto">
          <table className="text-sm sm:text-base w-full">
            <thead>
              <tr className="bg-kanaliiga-light-brown/30 uppercase text-kanaliiga-orange">
                <th className="px-3 py-2 text-left whitespace-nowrap font-semibold">
                  MAP
                </th>
                <th className="px-3 py-2 text-center whitespace-nowrap font-semibold">
                  PLAYED
                </th>
                <th className="px-3 py-2 text-center whitespace-nowrap font-semibold">
                  WINS
                </th>
                <th className="px-3 py-2 text-center whitespace-nowrap font-semibold">
                  LOSSES
                </th>
                <th className="px-3 py-2 text-center whitespace-nowrap font-semibold">
                  WIN %
                </th>
                <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold">
                  AVG SCORE
                </th>
                <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold">
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
                    <td className="px-3 py-2 text-left">
                      {mapToReadableName(mapStat.map_name)}
                    </td>
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
