import {
  createStatsKanaliigaImageUrl,
  type FilterParamsQuery
} from "@/lib/utils";

import { ChevronUp, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { PlayerTable } from "../players/player-table";
import Image from "next/image";
import { useTeamDetails } from "@/hooks/data/useTeamDetails";
import { useState, useMemo } from "react";
import { ContentContainer } from "@/components/layout/content-container";
import { TablePagination } from "../tables/table-pagination";

interface TeamTableProps {
  filterQueryParams: FilterParamsQuery;
  teamId: number;
}

export const TeamsTable = ({ filterQueryParams, teamId }: TeamTableProps) => {
  const router = useRouter();

  // Get team details
  const {
    teamDetails,
    isLoading: isTeamLoading,
    error
  } = useTeamDetails({
    teamId,
    filterQueryParams
  });

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "date",
    direction: "desc"
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleSortClick = (key: string) => {
    let direction: "asc" | "desc" = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  // Sort the matches
  const sortedMatches = useMemo(() => {
    if (!teamDetails?.matches || teamDetails.matches.length === 0) return [];

    return [...teamDetails.matches].sort((a, b) => {
      if (sortConfig.key === "date") {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
      }

      // Handle other sort keys if needed
      return 0;
    });
  }, [teamDetails?.matches, sortConfig]);

  // Calculate pagination
  const totalMatches = sortedMatches.length;
  const totalPages = Math.ceil(totalMatches / itemsPerPage);
  const paginatedMatches = sortedMatches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (error) {
    return <ContentContainer>Error loading team details</ContentContainer>;
  }

  if (isTeamLoading) {
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

  if (!teamDetails) {
    return <ContentContainer>Team not found</ContentContainer>;
  }

  const { team, map_stats } = teamDetails;

  return (
    <div>
      {" "}
      {/* Team Header */}
      <div className="bg-card rounded-md overflow-hidden mb-3">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <Image
              src={createStatsKanaliigaImageUrl(team.team_logo)}
              alt={team.name}
              width={80}
              height={80}
              className="rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold text-kanaliiga-orange">
                {team.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground">
                  {team.league_name}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {team.season_name}
                </span>
              </div>
            </div>
            <div className="ml-auto">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-muted-foreground text-sm">GP</div>
                  <div className="text-lg font-semibold">
                    {team.matches_played}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground text-sm">W</div>
                  <div className="text-lg font-semibold text-green-500">
                    {team.wins}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground text-sm">L</div>
                  <div className="text-lg font-semibold text-red-500">
                    {team.losses}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground text-sm">Win%</div>
                  <div className="text-lg font-semibold">
                    {team.win_percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Map statistics section */}
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
                    AVG OPP
                  </th>
                  <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold text-muted-foreground">
                    AVG RATING
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kanaliiga-light-brown/10">
                {(map_stats || []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-4 text-center text-muted-foreground"
                    >
                      No map statistics available
                    </td>
                  </tr>
                ) : (
                  (map_stats || []).map((mapStat) => (
                    <tr
                      key={mapStat.map_id}
                      className="hover:bg-kanaliiga-light-brown/10"
                    >
                      <td className="px-3 py-2 text-left">
                        {mapStat.map_name}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {mapStat.matches_played}
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
                      <td className="hidden md:table-cell px-3 py-2 text-center font-bold">
                        {mapStat.avg_rating}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Players Section */}
      <div className="bg-card rounded-md overflow-hidden mb-3">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-2">Team Players</h2>
          <PlayerTable
            filterQueryParams={{
              ...filterQueryParams,
              teams: [Number(teamId)]
            }}
          />
        </div>
      </div>
      {/* Team match history section */}
      <div className="bg-card rounded-md overflow-hidden">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-2">Match History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#2a1810] text-xs uppercase">
                  <th className="px-3 py-2 text-left whitespace-nowrap font-semibold text-kanaliiga-orange">
                    <div
                      className="flex items-center cursor-pointer hover:bg-[#3a281a]"
                      onClick={() => handleSortClick("date")}
                    >
                      OPPONENT
                      {sortConfig.key === "date" && (
                        <span className="ml-1">
                          {sortConfig.direction === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-3 py-2 text-center whitespace-nowrap font-semibold text-kanaliiga-orange">
                    SCORE
                  </th>
                  <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold text-kanaliiga-orange">
                    MAP
                  </th>
                  <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold text-kanaliiga-orange">
                    DATE
                  </th>
                  <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold text-kanaliiga-orange">
                    RESULT
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kanaliiga-light-brown/10">
                {isTeamLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      Loading matches...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-red-500">
                      Error loading match data.
                    </td>
                  </tr>
                ) : sortedMatches && sortedMatches.length > 0 ? (
                  paginatedMatches.map((match) => {
                    const teamWon = match.result === "win";
                    const formattedDate = format(
                      new Date(match.date),
                      "dd.MM.yyyy"
                    );

                    return (
                      <tr
                        key={match.match_id}
                        className="hover:bg-kanaliiga-light-brown/10 cursor-pointer"
                        onClick={() =>
                          router.push(`/matches/${match.match_id}`)
                        }
                      >
                        <td className="px-3 py-2 text-left">
                          <div className="flex items-center gap-2">
                            <Image
                              src={createStatsKanaliigaImageUrl(
                                match.opponent_logo
                              )}
                              alt={match.opponent_name}
                              width={20}
                              height={20}
                              className="rounded-full"
                            />
                            {match.opponent_name}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={
                              teamWon ? "text-green-500" : "text-red-500"
                            }
                          >
                            {match.team_score}
                          </span>
                          -
                          <span
                            className={
                              !teamWon ? "text-green-500" : "text-red-500"
                            }
                          >
                            {match.opponent_score}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-3 py-2 text-center">
                          {match.maps}
                        </td>
                        <td className="hidden md:table-cell px-3 py-2 text-center">
                          {formattedDate}
                        </td>
                        <td className="hidden md:table-cell px-3 py-2 text-center">
                          <span
                            className={
                              match.result === "win"
                                ? "text-green-500"
                                : match.result === "loss"
                                  ? "text-red-500"
                                  : "text-yellow-500"
                            }
                          >
                            {match.result.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      No matches found for this team.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {sortedMatches.length > 10 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalRows={totalMatches}
              pageSize={itemsPerPage}
              handlePageChange={(page) => setCurrentPage(page)}
              handlePageSizeChange={(size) => {
                setCurrentPage(1);
                setItemsPerPage(size);
              }}
              type="matches"
            />
          )}
        </div>
      </div>
    </div>
  );
};
