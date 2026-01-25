"use client";

import { useAuth } from "@/context/AuthContext";
import { useSeasonCaptains } from "@/hooks/data/useSeasonCaptains";
import { hasCaptainsAccess, getUserHighestRole } from "@/lib/roleUtils";
import { CardContainer } from "../layout/CardContainer";
import { ContentContainer } from "../layout/ContentContainer";
import { AuthLoading } from "../loading/AuthLoading";
import { TableSkeleton } from "../loading/TableSkeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useMemo } from "react";
import {
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState
} from "@tanstack/react-table";
import type { TeamCaptain, CustomColumnMeta } from "@eggosystem/types";
import { TanStackTableWrapper } from "../tables/TanStackTableWrapper";

export const CaptainsPage = ({
  seasonId,
  seasonName
}: {
  seasonId: string;
  seasonName: string;
}) => {
  const { user, loading: authLoading } = useAuth();
  const { captains, isLoading, isValidating, isError } =
    useSeasonCaptains(seasonId);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "team_name", desc: false }
  ]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<TeamCaptain>[]>(
    () => [
      {
        accessorKey: "team_name",
        header: "Team",
        cell: ({ getValue }) => (
          <div className="font-medium text-foreground">
            {getValue<string>()}
          </div>
        ),
        meta: {
          responsive: "table-cell",
          tooltip: "Team Name",
          sortable: true
        } satisfies CustomColumnMeta
      },
      {
        accessorKey: "captain_discord",
        header: "Captain",
        cell: ({ getValue }) => {
          const value = getValue<string>();
          return value ? (
            <div className="text-foreground">{value}</div>
          ) : (
            <div className="text-muted-foreground italic">Not set</div>
          );
        },
        meta: {
          responsive: "table-cell",
          tooltip: "Captain Discord",
          sortable: true
        } satisfies CustomColumnMeta
      },
      {
        accessorKey: "co_captain_discord",
        header: "Co-Captain",
        cell: ({ getValue }) => {
          const value = getValue<string>();
          return value ? (
            <div className="text-foreground">{value}</div>
          ) : (
            <div className="text-muted-foreground italic">Not set</div>
          );
        },
        meta: {
          responsive: "table-cell",
          tooltip: "Co-Captain Discord",
          sortable: true
        } satisfies CustomColumnMeta
      }
    ],
    []
  );

  // Show loading while initial auth check
  if (authLoading) {
    return <AuthLoading />;
  }

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
            This page is restricted to users with admin, captain, helpdesk, or
            caster roles.
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
            disabled={isLoading || isValidating}
          />
        </div>
      </div>

      <CardContainer classNames="p-2 md:p-4">
        {isLoading || isValidating ? (
          <TableSkeleton rows={10} columns={3} />
        ) : (
          <>
            <TanStackTableWrapper
              data={captains || []}
              columns={columns}
              getSortedRowModel={getSortedRowModel()}
              getFilteredRowModel={getFilteredRowModel()}
              sorting={sorting}
              onSortingChange={setSorting}
              state={{
                sorting,
                globalFilter
              }}
              onGlobalFilterChange={setGlobalFilter}
              globalFilterFn="includesString"
              showPagination={false}
              customRowClassName={() =>
                "border-b border-border h-10 transition-colors hover:bg-kanaliiga-light-brown/10"
              }
            />
            {(captains?.length ?? 0) === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {globalFilter
                  ? "No results found for your search."
                  : "No team captains found."}
              </div>
            )}
          </>
        )}
      </CardContainer>
    </div>
  );
};
