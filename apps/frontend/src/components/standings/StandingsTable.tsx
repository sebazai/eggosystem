"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState
} from "@tanstack/react-table";
import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { StandingsFaceitTeamStats } from "@eggosystem/types";

interface StandingsTableProps {
  data: StandingsFaceitTeamStats[];
  isLoading?: boolean;
}

export const StandingsTable = ({ data, isLoading }: StandingsTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "points", desc: true },
    { id: "rounds_diff", desc: true }
  ]);

  const columnHelper = createColumnHelper<StandingsFaceitTeamStats>();

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "position",
        header: "#",
        cell: ({ row }) => <span className="font-medium">{row.index + 1}</span>,
        meta: { className: "text-left w-[50px]" }
      }),
      columnHelper.accessor("team_name", {
        header: "Team",
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue()}</span>
        ),
        meta: { className: "text-left" }
      }),
      columnHelper.accessor("games_played", {
        header: "Played",
        meta: { className: "text-center" }
      }),
      columnHelper.accessor("maps_won", {
        header: "Won",
        meta: { className: "text-center" }
      }),
      columnHelper.accessor("maps_won_ot", {
        header: "Won (OT)",
        meta: { className: "text-center" }
      }),
      columnHelper.accessor("maps_lost", {
        header: "Lost",
        meta: { className: "text-center" }
      }),
      columnHelper.accessor("maps_lost_ot", {
        header: "Lost (OT)",
        meta: { className: "text-center" }
      }),
      columnHelper.accessor("points", {
        header: "Points",
        cell: ({ getValue }) => (
          <span className="font-semibold">{getValue()}</span>
        ),
        meta: { className: "text-center font-semibold" }
      }),
      columnHelper.accessor("rounds_won", {
        header: "Rounds Won",
        meta: { className: "text-center" }
      }),
      columnHelper.accessor("rounds_lost", {
        header: "Rounds Lost",
        meta: { className: "text-center" }
      }),
      columnHelper.accessor("rounds_diff", {
        header: "Round Diff",
        cell: ({ getValue }) => {
          const value = getValue();
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
        meta: { className: "text-center" }
      })
    ],
    [columnHelper]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        "p-3 font-medium",
                        (header.column.columnDef.meta as { className?: string })
                          ?.className || "text-left",
                        header.column.getCanSort()
                          ? "cursor-pointer select-none hover:bg-muted/50"
                          : ""
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {header.column.getCanSort() && (
                          <div className="flex flex-col">
                            {header.column.getIsSorted() === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <div className="h-4 w-4 opacity-50">
                                <ChevronUp className="h-2 w-4" />
                                <ChevronDown className="h-2 w-4" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b hover:bg-muted/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn(
                        "p-3",
                        (cell.column.columnDef.meta as { className?: string })
                          ?.className || "text-left"
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
