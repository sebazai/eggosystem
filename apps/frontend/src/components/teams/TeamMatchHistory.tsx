import {
  convertSeasonToS,
  createTeamLogoUrl,
  mapToReadableNameCapitalFirst,
  type FilterParamsQuery
} from "@/lib/utils";

import { format } from "date-fns";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TanStackTableWrapper } from "../tables/TanStackTableWrapper";
import { useFilteredTeamMatchHistory } from "@/hooks/data/filtered/useFilteredTeamMatchHistory";
import { NextImageFallback } from "../layout/NextImageFallback";
import { TableSkeleton } from "@/components/loading";
import {
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  type PaginationState
} from "@tanstack/react-table";
import type { TeamMatchHistory as TeamMatchHistoryType } from "@eggosystem/types";
import { MatchRowScoreComponents } from "../shared/MatchRowScoreComponents";

interface TeamMatchHistoryProps {
  teamId: number;
  filterQueryParams: FilterParamsQuery;
}

export const TeamMatchHistory = ({
  teamId,
  filterQueryParams
}: TeamMatchHistoryProps) => {
  const router = useRouter();
  const { teamMatchHistory, isLoading, error } = useFilteredTeamMatchHistory({
    teamId,
    filterQueryParams
  });

  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true }
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  });

  // TanStack Table column definitions
  const columns = useMemo<ColumnDef<TeamMatchHistoryType>[]>(
    () => [
      {
        accessorKey: "opponent_name",
        header: "OPPONENT",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <NextImageFallback
              src={createTeamLogoUrl(row.original.opponent_logo)}
              alt={row.original.opponent_name}
              width={20}
              height={20}
              className="rounded-full"
            />
            {row.original.opponent_name}
          </div>
        ),
        meta: {
          responsive: "table-cell",
          tooltip: "Opponent Team",
          sortable: true
        }
      },
      {
        id: "league",
        header: "LEAGUE",
        cell: ({ row }) =>
          `${convertSeasonToS(row.original.season_name)} ${row.original.league_name}`,
        meta: {
          responsive: "hidden xs:table-cell",
          tooltip: "Season and League",
          sortable: true
        }
      },
      {
        id: "score",
        header: "SCORE",
        cell: ({ row }) => {
          const teamWon = row.original.team_score > row.original.opponent_score;
          return (
            <>
              <MatchRowScoreComponents
                score={row.original.team_score}
                teamWon={teamWon}
              />
              -
              <MatchRowScoreComponents
                score={row.original.opponent_score}
                teamWon={!teamWon}
              />
            </>
          );
        },
        meta: {
          responsive: "table-cell",
          tooltip: "Match score",
          sortable: true
        }
      },
      {
        accessorKey: "maps",
        header: "MAP",
        cell: ({ getValue }) => {
          const maps = getValue<string>();
          return maps
            .split(", ")
            .map((name) => mapToReadableNameCapitalFirst(name))
            .join(", ");
        },
        meta: {
          responsive: "hidden md:table-cell",
          tooltip: "Maps Played",
          sortable: true
        }
      },
      {
        accessorKey: "date",
        header: "DATE",
        cell: ({ getValue }) => {
          const date = getValue<string>();
          return date ? format(new Date(date), "dd.MM.yyyy") : "N/A";
        },
        meta: {
          responsive: "hidden md:table-cell",
          tooltip: "Match Date",
          sortable: true
        }
      },
      {
        accessorKey: "result",
        header: "RESULT",
        cell: ({ getValue }) => {
          const result = getValue<string>();
          console.log(result);
          return (
            <span
              className={
                result === "won"
                  ? "text-green-500"
                  : result === "lost"
                    ? "text-red-500"
                    : "text-yellow-500"
              }
            >
              {result.toUpperCase()}
            </span>
          );
        },
        meta: {
          responsive: "hidden md:table-cell",
          tooltip: "Match Result",
          sortable: true
        }
      }
    ],
    []
  );

  const handleRowClick = (match: TeamMatchHistoryType) => {
    const url = match.match_game_id
      ? `/matches/${match.match_id}/games/${match.match_game_id}`
      : `/matches/${match.match_id}`;
    router.push(url);
  };

  const handleRowMiddleClick = (match: TeamMatchHistoryType) => {
    const url = match.match_game_id
      ? `/matches/${match.match_id}/games/${match.match_game_id}`
      : `/matches/${match.match_id}`;
    window.open(url, "_blank");
  };

  if (error) {
    return (
      <div className="bg-card rounded-md overflow-hidden pt-4 sm:pt-2">
        <h2 className="text-xl font-semibold mb-2">Match History</h2>
        <p className="text-muted-foreground">
          There was an error loading the team match history. Please try again
          later or adjust your filters.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-card rounded-md overflow-hidden pt-4 sm:pt-2">
        <h2 className="text-xl font-semibold mb-2">Match History</h2>
        <TableSkeleton rows={10} columns={6} showHeader={false} />
      </div>
    );
  }

  if (teamMatchHistory?.length === 0) {
    return (
      <div className="bg-card rounded-md overflow-hidden pt-4 sm:pt-2">
        <h2 className="text-xl font-semibold mb-2">Match History</h2>
        <div className="text-center text-muted-foreground">
          No match history available for this team with the current filters.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-md overflow-hidden pt-4 sm:pt-2">
      <h2 className="text-xl font-semibold mb-2">Match History</h2>
      <TanStackTableWrapper
        data={teamMatchHistory || []}
        columns={columns}
        getSortedRowModel={getSortedRowModel()}
        getPaginationRowModel={getPaginationRowModel()}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        initialState={{
          sorting: [{ id: "date", desc: true }],
          pagination: {
            pageIndex: 0,
            pageSize: 10
          }
        }}
        onRowClick={handleRowClick}
        onRowMiddleClick={handleRowMiddleClick}
        showPagination={(teamMatchHistory?.length ?? 0) > 0}
        paginationType="matches"
      />
    </div>
  );
};
