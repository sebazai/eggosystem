import {
  convertSeasonToS,
  createTeamLogoUrl,
  mapToReadableNameCapitalFirst,
  type FilterParamsQuery
} from "@/lib/utils";

import { ChevronUp, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { TablePagination } from "../tables/table-pagination";
import { useFilteredTeamMatchHistory } from "@/hooks/data/filtered/useFilteredTeamMatchHistory";
import { NextImageFallback } from "../layout/image-with-fallback";

interface TeamMatchHistoryProps {
  teamId: number;
  filterQueryParams: FilterParamsQuery;
}

export const TeamMatchHistory = ({
  teamId,
  filterQueryParams
}: TeamMatchHistoryProps) => {
  const { teamMatchHistory, isLoading, error } = useFilteredTeamMatchHistory({
    teamId,
    filterQueryParams
  });

  const router = useRouter();
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
    if (!teamMatchHistory || teamMatchHistory.length === 0) return [];

    return [...teamMatchHistory].sort((a, b) => {
      if (sortConfig.key === "date") {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
      }

      // Handle other sort keys if needed
      return 0;
    });
  }, [teamMatchHistory, sortConfig]);

  // Calculate pagination
  const totalMatches = sortedMatches.length;
  const totalPages = Math.ceil(totalMatches / itemsPerPage);
  const paginatedMatches = sortedMatches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-card rounded-md overflow-hidden">
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2">Match History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-kanaliiga-light-brown/30 text-xs uppercase text-kanaliiga-orange">
                <th className="px-3 py-2 text-left whitespace-nowrap font-semibold">
                  OPPONENT
                </th>
                <th className="hidden xs:table-cell px-3 py-2 text-left whitespace-nowrap font-semibold">
                  LEAGUE
                </th>
                <th className="px-3 py-2 text-center whitespace-nowrap font-semibold">
                  SCORE
                </th>
                <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold">
                  MAP
                </th>
                <th
                  className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold hover:bg-kanaliiga-light-brown/30 cursor-pointer"
                  onClick={() => handleSortClick("date")}
                >
                  <div className="flex justify-center">
                    DATE
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
                <th className="hidden md:table-cell px-3 py-2 text-center whitespace-nowrap font-semibold">
                  RESULT
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kanaliiga-light-brown/10">
              {isLoading ? (
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
                  const teamWon = match.result === "won";
                  const formattedDate = format(
                    new Date(match.date),
                    "dd.MM.yyyy"
                  );

                  return (
                    <tr
                      key={match.match_id}
                      className="hover:bg-kanaliiga-light-brown/10 cursor-pointer"
                      onClick={() =>
                        router.push(
                          match.game_id
                            ? `/matches/${match.match_id}/games/${match.game_id}`
                            : `/matches/${match.match_id}`
                        )
                      }
                      onMouseDown={(e) => {
                        // Handle middle mouse button (wheel) click
                        if (e.button === 1) {
                          e.preventDefault(); // Prevent scroll behavior
                          const url = match.game_id
                            ? `/matches/${match.match_id}/games/${match.game_id}`
                            : `/matches/${match.match_id}`;
                          window.open(url, '_blank');
                        }
                      }}
                    >
                      <td className="px-3 py-2 text-left">
                        <div className="flex items-center gap-2">
                          <NextImageFallback
                            src={createTeamLogoUrl(match.opponent_logo)}
                            alt={match.opponent_name}
                            width={20}
                            height={20}
                            className="rounded-full"
                          />
                          {match.opponent_name}
                        </div>
                      </td>
                      <td className="hidden xs:table-cell px-3 py-2 text-left">
                        {convertSeasonToS(match.season_name)}{" "}
                        {match.league_name}
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
                        {match.maps
                          .split(", ")
                          .map((name) => mapToReadableNameCapitalFirst(name))
                          .join(", ")}
                      </td>
                      <td className="hidden md:table-cell px-3 py-2 text-center">
                        {formattedDate}
                      </td>
                      <td className="hidden md:table-cell px-3 py-2 text-center">
                        <span
                          className={
                            match.result === "won"
                              ? "text-green-500"
                              : match.result === "lost"
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

        {sortedMatches.length > 0 && (
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
  );
};
