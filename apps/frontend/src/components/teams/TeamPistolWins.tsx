"use client";

import { useFilteredTeamPistolWins } from "@/hooks/data/filtered/useFilteredTeamPistolWins";
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
import type { TeamPistolWinStat } from "@eggosystem/types";

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

  const [sorting, setSorting] = useState<SortingState>([]);

  // TanStack Table column definitions
  const columns = useMemo<ColumnDef<TeamPistolWinStat>[]>(
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
        accessorKey: "pistol_rounds_played",
        header: "PLAYED",
        cell: ({ getValue }) => getValue<number>(),
        meta: {
          responsive: "table-cell",
          tooltip: "Pistol Rounds Played",
          sortable: true
        }
      },
      {
        accessorKey: "pistol_rounds_won",
        header: "WINS",
        cell: ({ getValue }) => (
          <span className="text-green-500">{getValue<number>()}</span>
        ),
        meta: {
          responsive: "table-cell",
          tooltip: "Pistol Rounds Won",
          sortable: true
        }
      },
      {
        accessorKey: "pistol_win_percentage",
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
          tooltip: "Pistol Win Percentage",
          sortable: true
        }
      }
    ],
    []
  );

  // TanStack Table configuration
  const table = useReactTable({
    data: teamPistolWins || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting
    }
  });

  if (isLoading || isValidating) {
    return (
      <div className="bg-card rounded-md overflow-hidden mb-3">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-2">
            Pistol Round Statistics
          </h2>
          <div className="text-center">
            <div className="h-6 w-40 bg-kanaliiga-light-brown/30 animate-pulse rounded mx-auto mb-3" />
            <div className="h-4 w-60 bg-kanaliiga-light-brown/30 animate-pulse rounded mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!teamPistolWins || teamPistolWins.length === 0) {
    return (
      <div className="bg-card rounded-md overflow-hidden mb-3">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-2">
            Pistol Round Statistics
          </h2>
          <div className="text-center text-muted-foreground">
            No pistol round statistics available for this team with the current
            filters.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-md overflow-hidden mb-3">
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2">Pistol Round Statistics</h2>
        <BaseTable table={table} showPagination={false} />
      </div>
    </div>
  );
};
