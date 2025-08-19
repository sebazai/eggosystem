"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FlaggedMatches } from "@eggosystem/types";
import { useFlaggedMatches } from "@/hooks/data/dashboard/useFlaggedMatches";

export const FlaggedMatchesTable = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { flaggedMatches, isLoading, error } = useFlaggedMatches();

  const columnHelper = createColumnHelper<FlaggedMatches>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("external_match_id", {
        header: "Match ID",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{getValue()}</span>
        ),
        meta: { className: "text-left" }
      }),
      columnHelper.accessor("team_id", {
        header: "Team ID",
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue()}</span>
        ),
        meta: { className: "text-center" }
      }),
      columnHelper.accessor("steam_ids", {
        header: "Steam IDs",
        cell: ({ getValue }) => {
          const steamIds = getValue();
          return (
            <div className="flex flex-wrap gap-1">
              {steamIds.slice(0, 3).map((steamId) => (
                <Badge key={steamId} variant="secondary" className="text-xs">
                  {steamId}
                </Badge>
              ))}
              {steamIds.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{steamIds.length - 3} more
                </Badge>
              )}
            </div>
          );
        },
        enableSorting: false,
        meta: { className: "text-left min-w-[200px]" }
      }),
      columnHelper.accessor("match_ids", {
        header: "Match IDs",
        cell: ({ getValue }) => {
          const matchIds = getValue();
          return (
            <div className="flex flex-wrap gap-1">
              {matchIds.slice(0, 2).map((matchId) => (
                <Badge key={matchId} variant="secondary" className="text-xs">
                  {matchId}
                </Badge>
              ))}
              {matchIds.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{matchIds.length - 2} more
                </Badge>
              )}
            </div>
          );
        },
        enableSorting: false,
        meta: { className: "text-left hidden md:table-cell" }
      }),
      columnHelper.accessor("players_added_for_this_match", {
        header: "Added Players",
        cell: ({ getValue }) => {
          const addedPlayers = getValue();
          if (addedPlayers.length === 0) {
            return <span className="text-muted-foreground text-sm">None</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {addedPlayers.slice(0, 2).map((player) => (
                <Badge key={player} variant="destructive" className="text-xs">
                  {player}
                </Badge>
              ))}
              {addedPlayers.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{addedPlayers.length - 2} more
                </Badge>
              )}
            </div>
          );
        },
        enableSorting: false,
        meta: { className: "text-left hidden lg:table-cell" }
      })
    ],
    [columnHelper]
  );

  const table = useReactTable({
    data: flaggedMatches ?? [],
    columns,
    state: {
      sorting
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Flagged Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                Loading flagged matches...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Flagged Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-500 font-medium mb-2">
              Failed to load flagged matches
            </div>
            <p className="text-muted-foreground text-sm">
              Please try refreshing the page or contact support if the problem
              persists.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!flaggedMatches || flaggedMatches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Flagged Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              No flagged matches found
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              All matches appear to be clean - no suspicious activity detected.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Flagged Matches
          <Badge variant="secondary" className="ml-2">
            {flaggedMatches.length}{" "}
            {flaggedMatches.length === 1 ? "match" : "matches"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta as
                      | {
                          className?: string;
                        }
                      | undefined;

                    return (
                      <th
                        key={header.id}
                        className={cn(
                          "px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider",
                          meta?.className
                        )}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              header.column.getCanSort()
                                ? "cursor-pointer select-none flex items-center gap-2 hover:text-foreground"
                                : ""
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getCanSort() && (
                              <div className="flex flex-col">
                                <ChevronUp
                                  className={cn(
                                    "h-3 w-3 -mb-1",
                                    header.column.getIsSorted() === "asc"
                                      ? "text-foreground"
                                      : "text-muted-foreground/50"
                                  )}
                                />
                                <ChevronDown
                                  className={cn(
                                    "h-3 w-3",
                                    header.column.getIsSorted() === "desc"
                                      ? "text-foreground"
                                      : "text-muted-foreground/50"
                                  )}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as
                      | {
                          className?: string;
                        }
                      | undefined;

                    return (
                      <td
                        key={cell.id}
                        className={cn("px-4 py-3 text-sm", meta?.className)}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
