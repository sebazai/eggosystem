import { useFilteredTeamMapStats } from "@/hooks/data/filtered/useFilteredTeamMapStats";
import { mapToReadableName, type FilterParamsQuery } from "@/lib/utils";
import { BaseTable } from "../tables/BaseTable";
import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState
} from "@tanstack/react-table";
import type { TeamMapStats as TeamMapStatsType } from "@eggosystem/types";

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

  const [sorting, setSorting] = useState<SortingState>([]);

  // TanStack Table column definitions
  const columns = useMemo<ColumnDef<TeamMapStatsType>[]>(
    () => [
      {
        accessorKey: "map_name",
        header: "MAP",
        cell: ({ getValue }) => mapToReadableName(getValue<string>()),
        meta: {
          responsive: "table-cell",
          tooltip: "Map Name",
          sortable: true
        }
      },
      {
        accessorKey: "maps_played",
        header: "PLAYED",
        cell: ({ getValue }) => getValue<number>(),
        meta: {
          responsive: "table-cell",
          tooltip: "Maps Played",
          sortable: true
        }
      },
      {
        accessorKey: "wins",
        header: "WINS",
        cell: ({ getValue }) => (
          <span className="text-green-500">{getValue<number>()}</span>
        ),
        meta: {
          responsive: "table-cell",
          tooltip: "Maps Won",
          sortable: true
        }
      },
      {
        accessorKey: "losses",
        header: "LOSSES",
        cell: ({ getValue }) => (
          <span className="text-red-500">{getValue<number>()}</span>
        ),
        meta: {
          responsive: "table-cell",
          tooltip: "Maps Lost",
          sortable: true
        }
      },
      {
        accessorKey: "win_percentage",
        header: "WIN %",
        cell: ({ getValue }) => {
          const percentage = getValue<number>();
          return (
            <span
              className={percentage > 50 ? "text-green-500" : "text-red-500"}
            >
              {percentage.toFixed(1)}%
            </span>
          );
        },
        meta: {
          responsive: "table-cell",
          tooltip: "Win Percentage",
          sortable: true
        }
      },
      {
        accessorKey: "avg_score",
        header: "AVG SCORE",
        cell: ({ getValue }) => getValue<string>(),
        meta: {
          responsive: "hidden md:table-cell",
          tooltip: "Average Score",
          sortable: true
        }
      },
      {
        accessorKey: "avg_opponent_score",
        header: "AVG OPP SCORE",
        cell: ({ getValue }) => getValue<string>(),
        meta: {
          responsive: "hidden md:table-cell",
          tooltip: "Average Opponent Score",
          sortable: true
        }
      }
    ],
    []
  );

  // TanStack Table configuration
  const table = useReactTable({
    data: teamMapStats || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting
    }
  });

  if (isLoading || isValidating || !teamMapStats) {
    return (
      <div className="bg-card rounded-md overflow-hidden mb-3">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-2">Map Statistics</h2>
          <div className="text-center">
            <div className="h-6 w-40 bg-kanaliiga-light-brown/30 animate-pulse rounded mx-auto mb-3" />
            <div className="h-4 w-60 bg-kanaliiga-light-brown/30 animate-pulse rounded mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (teamMapStats.length === 0) {
    return (
      <div className="bg-card rounded-md overflow-hidden mb-3">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-2">Map Statistics</h2>
          <div className="text-center text-muted-foreground">
            No map statistics available for this team with the current filters.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-md overflow-hidden mb-3">
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2">Map Statistics</h2>
        <BaseTable table={table} showPagination={false} />
      </div>
    </div>
  );
};
