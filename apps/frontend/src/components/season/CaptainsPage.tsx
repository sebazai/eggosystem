"use client";

import { useAuth } from "@/context/AuthContext";
import { useSeasonCaptains } from "@/hooks/data/useSeasonCaptains";
import { hasCaptainsAccess, getUserHighestRole } from "@/lib/roleUtils";
import { CardContainer } from "../layout/CardContainer";
import { ContentContainer } from "../layout/ContentContainer";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamCaptain } from "@eggosystem/types";

export const CaptainsPage = ({
  seasonId,
  seasonName
}: {
  seasonId: string;
  seasonName: string;
}) => {
  const { user } = useAuth();
  const { captains, isLoading, isValidating, isError } =
    useSeasonCaptains(seasonId);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "team_name", desc: false }
  ]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columnHelper = createColumnHelper<TeamCaptain>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("team_name", {
        header: "Team",
        cell: ({ getValue }) => (
          <div className="font-medium text-foreground">{getValue()}</div>
        ),
        meta: { className: "text-left" }
      }),
      columnHelper.accessor("captain_discord", {
        header: "Captain",
        cell: ({ getValue }) => {
          const value = getValue();
          return value ? (
            <div className="text-foreground">{value}</div>
          ) : (
            <div className="text-muted-foreground italic">Not set</div>
          );
        },
        meta: { className: "text-left" }
      }),
      columnHelper.accessor("co_captain_discord", {
        header: "Co-Captain",
        cell: ({ getValue }) => {
          const value = getValue();
          return value ? (
            <div className="text-foreground">{value}</div>
          ) : (
            <div className="text-muted-foreground italic">Not set</div>
          );
        },
        meta: { className: "text-left" }
      })
    ],
    [columnHelper]
  );

  const table = useReactTable({
    data: captains || [],
    columns,
    state: {
      sorting,
      globalFilter
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString"
  });

  // Check if user has access
  if (!hasCaptainsAccess(user)) {
    return (
      <ContentContainer>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <h1 className="text-3xl mb-4 text-red-600">Access Denied</h1>
          <p className="text-lg mb-4">
            You don&apos;t have permission to view this page.
          </p>
          <p className="text-gray-600">
            This page is restricted to users with admin, captain, or helpdesk
            roles.
          </p>
          {user && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-700">
                Your current roles: {user.roles.join(", ")}
              </p>
            </div>
          )}
        </div>
      </ContentContainer>
    );
  }

  if (isError) {
    return (
      <ContentContainer>
        <div className="text-center text-destructive text-lg mb-4">
          {isError.message}
        </div>
      </ContentContainer>
    );
  }

  if (isLoading || isValidating) {
    return (
      <ContentContainer>
        <div className="text-center text-lg">Loading team captains...</div>
      </ContentContainer>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl">Team Captains - {seasonName}</h1>
        {user && (
          <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
            Access granted as:{" "}
            <span className="font-semibold text-foreground">
              {getUserHighestRole(user)}
            </span>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teams, captains, or co-captains..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <CardContainer classNames="p-2 md:p-4">
        <div className="bg-card overflow-hidden">
          <div className="overflow-auto">
            <table className="text-sm sm:text-base w-full">
              <thead>
                <tr className="bg-kanaliiga-light-brown/30 uppercase text-kanaliiga-orange">
                  {table.getHeaderGroups().map((headerGroup) =>
                    headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={cn(
                          "px-3 py-2 text-left whitespace-nowrap font-semibold cursor-pointer select-none",
                          header.column.getCanSort() &&
                            "hover:bg-kanaliiga-light-brown/50"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <div className="flex flex-col">
                              <ChevronUp
                                className={cn(
                                  "h-3 w-3 transition-colors",
                                  header.column.getIsSorted() === "asc"
                                    ? "text-foreground"
                                    : "text-muted-foreground/50"
                                )}
                              />
                              <ChevronDown
                                className={cn(
                                  "h-3 w-3 -mt-1 transition-colors",
                                  header.column.getIsSorted() === "desc"
                                    ? "text-foreground"
                                    : "text-muted-foreground/50"
                                )}
                              />
                            </div>
                          )}
                        </div>
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border h-10 transition-colors hover:bg-kanaliiga-light-brown/10"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          "px-3 py-2",
                          (cell.column.columnDef.meta as { className?: string })
                            ?.className
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
            {table.getRowModel().rows.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {globalFilter
                  ? "No results found for your search."
                  : "No team captains found."}
              </div>
            )}
          </div>
        </div>
      </CardContainer>
    </div>
  );
};
