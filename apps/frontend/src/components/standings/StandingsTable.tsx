"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState
} from "@tanstack/react-table";
import { BaseTable } from "../tables/BaseTable";
import type {
  StandingsFaceitTeamStats,
  CustomColumnMeta
} from "@eggosystem/types";

interface StandingsTableProps {
  data: StandingsFaceitTeamStats[];
  isLoading?: boolean;
}

export const StandingsTable = ({ data, isLoading }: StandingsTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "points", desc: true },
    { id: "rounds_diff", desc: true }
  ]);

  // TanStack Table column definitions
  const columns = useMemo<ColumnDef<StandingsFaceitTeamStats>[]>(
    () => [
      {
        id: "position",
        header: "#",
        cell: ({ row }) => <span className="font-medium">{row.index + 1}</span>,
        meta: {
          responsive: "table-cell",
          tooltip: "Position",
          sortable: false
        }
      },
      {
        accessorKey: "team_name",
        header: "TEAM",
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue<string>()}</span>
        ),
        meta: {
          responsive: "table-cell",
          tooltip: "Team Name",
          sortable: true
        }
      },
      {
        accessorKey: "games_played",
        header: "PLAYED",
        cell: ({ getValue }) => getValue<number>(),
        meta: {
          responsive: "table-cell",
          tooltip: "Games Played",
          sortable: true
        }
      },
      {
        accessorKey: "maps_won",
        header: "WON",
        cell: ({ getValue }) => getValue<number>(),
        meta: {
          responsive: "table-cell",
          tooltip: "Maps Won",
          sortable: true
        }
      },
      {
        accessorKey: "maps_won_ot",
        header: "WON (OT)",
        cell: ({ getValue }) => getValue<number>(),
        meta: {
          responsive: "hidden md:table-cell",
          tooltip: "Maps Won in Overtime",
          sortable: true
        }
      },
      {
        accessorKey: "maps_lost",
        header: "LOST",
        cell: ({ getValue }) => getValue<number>(),
        meta: {
          responsive: "table-cell",
          tooltip: "Maps Lost",
          sortable: true
        }
      },
      {
        accessorKey: "maps_lost_ot",
        header: "LOST (OT)",
        cell: ({ getValue }) => getValue<number>(),
        meta: {
          responsive: "hidden md:table-cell",
          tooltip: "Maps Lost in Overtime",
          sortable: true
        }
      },
      {
        accessorKey: "points",
        header: "POINTS",
        cell: ({ getValue }) => (
          <span className="font-semibold">{getValue<number>()}</span>
        ),
        meta: {
          responsive: "table-cell",
          tooltip: "Points",
          sortable: true
        }
      },
      {
        accessorKey: "rounds_won",
        header: "ROUNDS WON",
        cell: ({ getValue }) => getValue<number>(),
        meta: {
          responsive: "hidden lg:table-cell",
          tooltip: "Rounds Won",
          sortable: true
        }
      },
      {
        accessorKey: "rounds_lost",
        header: "ROUNDS LOST",
        cell: ({ getValue }) => getValue<number>(),
        meta: {
          responsive: "hidden lg:table-cell",
          tooltip: "Rounds Lost",
          sortable: true
        }
      },
      {
        accessorKey: "rounds_diff",
        header: "ROUND DIFF",
        cell: ({ getValue }) => {
          const value = getValue<number>();
          return (
            <span
              className={cn(
                "font-medium",
                value > 0
                  ? "text-green-600 dark:text-green-400"
                  : value < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground"
              )}
            >
              {value > 0 ? "+" : ""}
              {value}
            </span>
          );
        },
        meta: {
          responsive: "table-cell",
          tooltip: "Round Difference",
          sortable: true
        }
      }
    ],
    []
  );

  // TanStack Table configuration
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting
    },
    initialState: {
      sorting: [
        { id: "points", desc: true },
        { id: "rounds_diff", desc: true }
      ]
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>League Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading standings...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>League Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium text-muted-foreground">
                No standings data available
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Please check back later or try a different league
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>League Standings</CardTitle>
      </CardHeader>
      <CardContent>
        <BaseTable table={table} showPagination={false} />
      </CardContent>
    </Card>
  );
};
