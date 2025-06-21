"use client";

import { useFilteredTeamPistolWins } from "@/hooks/data/filtered/useFilteredTeamPistolWins";
import { mapToReadableName, type FilterParamsQuery } from "@/lib/utils";

interface TeamPistolWinsProps {
  teamId: number;
  filterQueryParams: FilterParamsQuery;
}

export const TeamPistolWins = ({
  teamId,
  filterQueryParams
}: TeamPistolWinsProps) => {
  const { teamPistolWins, isLoading, isValidating } = useFilteredTeamPistolWins(
    {
      teamId,
      filterQueryParams
    }
  );

  if (isLoading || isValidating) {
    // SKELETON
    return <></>;
  }

  // Make sure teamPistolWins exists and is an array
  const pistolStats = Array.isArray(teamPistolWins) ? teamPistolWins : [];

  return (
    <div className="bg-card rounded-md overflow-hidden mb-3">
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2">Pistol Round Statistics</h2>
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
                  WIN %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kanaliiga-light-brown/10">
              {pistolStats.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-4 text-center text-muted-foreground"
                  >
                    No pistol round statistics available
                  </td>
                </tr>
              ) : (
                pistolStats.map((pistolStat) => (
                  <tr
                    key={pistolStat.map_id}
                    className="hover:bg-kanaliiga-light-brown/10"
                  >
                    <td className="px-3 py-2 text-left">
                      {mapToReadableName(pistolStat.map_name)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {pistolStat.pistol_rounds_played}
                    </td>
                    <td className="px-3 py-2 text-center text-green-500">
                      {pistolStat.pistol_rounds_won}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={
                          pistolStat.pistol_win_percentage > 50
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        {pistolStat.pistol_win_percentage.toFixed(1)}%
                      </span>
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
