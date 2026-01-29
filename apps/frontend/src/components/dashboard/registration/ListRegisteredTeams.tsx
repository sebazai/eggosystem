"use client";

import {
  useRegisteredTeams,
  useBulkApproveTeams,
  useManualValidityCheck
} from "@/hooks/data/dashboard/useRegisteredTeams";
import { useDashboardSeason } from "@/hooks/data/dashboard/useDashboardSeason";
import { Spinner } from "@/components/ui/spinner";
import {
  getExpandedRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState
} from "@tanstack/react-table";
import type {
  SeasonRegisteredTeamsWithPlayersValidatedTeams,
  CustomColumnMeta
} from "@eggosystem/types";
import React, { useMemo, useState, useRef } from "react";
import type { Table } from "@tanstack/react-table";
import {
  ExternalLink,
  CheckCircle,
  ChevronsDown,
  ChevronsUp
} from "lucide-react";
import { envConfig } from "@/configs/env";
import { createPlatformTeamUrl } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TanStackTableWrapper } from "../../tables/TanStackTableWrapper";
import { ExpandableRow } from "../../tables/ExpandableRow";
import { RowSelection } from "../../tables/RowSelection";
import type { RegisteredTeamPlayer } from "@eggosystem/types";
import { TableSkeleton } from "@/components/loading";

/**
 * Determines the reason why a player needs approval based on their data
 * and the team's email domain pattern
 */
function getPlayerApprovalReason(
  player: RegisteredTeamPlayer,
  team: SeasonRegisteredTeamsWithPlayersValidatedTeams
): string[] {
  const reasons: string[] = [];

  // Check if work email is not verified
  if (!player.work_email_verified) {
    reasons.push("Work email not verified");
  }

  // Check if it's a personal email
  if (player.is_work_email_personal_email) {
    reasons.push("Personal email requires approval");
  }

  // Check if email domain differs from team's common domain
  // Find the most common work email ending (only for non-personal emails)
  const workEmailEndings = team.players
    .filter((p) => !p.is_work_email_personal_email)
    .map((p) => p.work_email.split("@")[1]);

  if (workEmailEndings.length > 0) {
    const mostCommonEmailEnding = workEmailEndings.reduce((a, b) => {
      const countA = workEmailEndings.filter((v) => v === a).length;
      const countB = workEmailEndings.filter((v) => v === b).length;
      if (countA > countB) return a;
      if (countB > countA) return b;
      return a;
    });

    const playerEmailDomain = player.work_email.split("@")[1];
    if (
      !player.is_work_email_personal_email &&
      playerEmailDomain !== mostCommonEmailEnding
    ) {
      reasons.push(
        `Different email domain (${playerEmailDomain} vs ${mostCommonEmailEnding})`
      );
    }
  }

  return reasons.length > 0 ? reasons : ["Requires approval"];
}

export const ListRegisteredTeams = () => {
  const { selectedSeasonId } = useDashboardSeason();
  const seasonId = selectedSeasonId ? Number(selectedSeasonId) : null;

  // Only call the hook if we have a valid season ID
  const { registeredTeams, isLoading, error } = useRegisteredTeams(seasonId);
  const { bulkApprove } = useBulkApproveTeams(seasonId);
  const { manualValidityCheck } = useManualValidityCheck(seasonId);

  // All hooks must be called before any early returns
  const [rowSelection, setRowSelection] = useState({});
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isAllRowsExpanded, setIsAllRowsExpanded] = useState(false);
  const tableRef =
    useRef<Table<SeasonRegisteredTeamsWithPlayersValidatedTeams> | null>(null);

  const columns = useMemo<
    ColumnDef<SeasonRegisteredTeamsWithPlayersValidatedTeams>[]
  >(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <RowSelection
            isSelected={table.getIsAllPageRowsSelected()}
            onToggle={table.getToggleAllPageRowsSelectedHandler()}
            isIndeterminate={table.getIsSomePageRowsSelected()}
          />
        ),
        cell: ({ row }) => (
          <RowSelection
            isSelected={row.getIsSelected()}
            onToggle={row.getToggleSelectedHandler()}
          />
        ),
        meta: {
          responsive: "table-cell",
          tooltip: "Select row",
          sortable: false
        } satisfies CustomColumnMeta
      },
      {
        id: "expander",
        header: () => null,
        cell: ({ row }) => (
          <ExpandableRow
            isExpanded={row.getIsExpanded()}
            onToggle={row.getToggleExpandedHandler()}
            canExpand={row.getCanExpand()}
          />
        ),
        meta: {
          responsive: "table-cell",
          tooltip: "Expand row",
          sortable: false
        } satisfies CustomColumnMeta
      },
      {
        accessorKey: "team_name",
        header: "Team",
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">
            {getValue<string>()}
          </span>
        ),
        meta: {
          responsive: "table-cell",
          tooltip: "Team Name",
          sortable: true
        } satisfies CustomColumnMeta
      },
      {
        accessorKey: "is_valid",
        header: "Valid",
        cell: ({ getValue }) =>
          getValue<boolean>() ? (
            <span className="text-green-600 font-bold">Yes</span>
          ) : (
            <span className="text-red-500 font-bold">No</span>
          ),
        meta: {
          responsive: "table-cell",
          tooltip: "Team Validity",
          sortable: true
        } satisfies CustomColumnMeta
      },
      {
        accessorKey: "approved",
        header: "Approved",
        cell: ({ getValue }) =>
          getValue<boolean>() ? (
            <span className="text-green-600 font-bold flex items-center justify-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Yes
            </span>
          ) : (
            <span className="text-red-500 font-bold">No</span>
          ),
        meta: {
          responsive: "table-cell",
          tooltip: "Approval Status",
          sortable: true
        } satisfies CustomColumnMeta
      },
      {
        accessorKey: "terms_and_conditions_approved",
        header: "Terms",
        cell: ({ getValue }) =>
          getValue<boolean>() ? (
            <span className="text-green-600 font-bold">Yes</span>
          ) : (
            <span className="text-red-500 font-bold">No</span>
          ),
        meta: {
          responsive: "table-cell",
          tooltip: "Terms and Conditions",
          sortable: true
        } satisfies CustomColumnMeta
      },
      {
        accessorKey: "external_platform_id",
        header: "Platform ID",
        cell: ({ getValue, row }) => {
          const platform = row.original.season_platform;
          const id = getValue<string | null>();
          if (!id) return <span className="text-muted-foreground">-</span>;
          const url = createPlatformTeamUrl(id, platform);
          if (url?.startsWith("/")) {
            return (
              <Link
                href={url || "#"}
                className="hover:underline inline-flex items-center gap-1"
              >
                {id}
                <ExternalLink className="inline w-3 h-3" />
              </Link>
            );
          } else if (url) {
            return (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline inline-flex items-center gap-1"
              >
                {id}
                <ExternalLink className="inline w-3 h-3" />
              </a>
            );
          } else {
            return <span>{id}</span>;
          }
        },
        meta: {
          responsive: "table-cell",
          tooltip: "Platform ID",
          sortable: true
        } satisfies CustomColumnMeta
      }
    ],
    []
  );

  // Calculate selected rows from rowSelection state
  const selectedRows = React.useMemo(() => {
    if (!registeredTeams) return [];
    const rowSelectionRecord = rowSelection as Record<string, boolean>;
    return Object.keys(rowSelectionRecord)
      .filter((key) => rowSelectionRecord[key])
      .map((key) => {
        const index = parseInt(key, 10);
        return registeredTeams[index];
      })
      .filter((team): team is SeasonRegisteredTeamsWithPlayersValidatedTeams =>
        Boolean(team)
      );
  }, [registeredTeams, rowSelection]);

  const hasSelectedRows = selectedRows.length > 0;

  const renderExpandedRow = (
    team: SeasonRegisteredTeamsWithPlayersValidatedTeams
  ) => (
    <div>
      {/* Team Leadership */}
      <div className="mb-4">
        <div className="font-semibold mb-2 text-kanaliiga-orange">
          Team Leadership
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          {team.captain_nickname && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Captain:</span>
              <span>
                {team.captain_discord || team.captain_nickname}
                {team.captain_discord && (
                  <span className="text-muted-foreground ml-1 text-xs">
                    ({team.captain_nickname})
                  </span>
                )}
              </span>
            </div>
          )}
          {team.co_captain_nickname && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Co-Captain:</span>
              <span>
                {team.co_captain_discord || team.co_captain_nickname}
                {team.co_captain_discord && (
                  <span className="text-muted-foreground ml-1 text-xs">
                    ({team.co_captain_nickname})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Players */}
      <div className="font-semibold mb-2 text-kanaliiga-orange">Players</div>
      <div className="flex flex-wrap gap-3 md:gap-4">
        {team.players.map((player) => {
          const isInvalid = team.invalid_players.some(
            (invalidPlayer) => invalidPlayer.steam_id === player.steam_id
          );

          return (
            <div
              key={player.steam_id}
              className={`flex flex-col gap-1 p-3 bg-background rounded border min-w-[200px] max-w-full md:max-w-xs shadow-sm ${
                isInvalid ? "border-red-500" : "border-border"
              }`}
            >
              <span className="font-semibold text-foreground break-words">
                {player.nickname}
              </span>
              <span className="text-[0.65rem] text-muted-foreground break-words">
                {player.work_email}
                {player.is_work_email_personal_email ? (
                  <span className="text-orange-600 ml-1">(Personal)</span>
                ) : (
                  <span className="text-green-600 ml-1">(Work)</span>
                )}
              </span>
              <span className="text-[0.65rem] text-muted-foreground flex items-center gap-2 flex-wrap">
                <a
                  href={`https://steamcommunity.com/profiles/${player.steam_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center gap-1"
                >
                  Steam
                  <ExternalLink className="inline w-3 h-3" />
                </a>
                <span>|</span>
                <a
                  href={`${envConfig.BASE_URL}/players/${player.steam_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center gap-1"
                >
                  Kanahub
                  <ExternalLink className="inline w-3 h-3" />
                </a>
              </span>
              <span className="font-mono text-xs select-all break-all text-muted-foreground">
                {player.steam_id}
              </span>
              {isInvalid && (
                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-[0.65rem] text-red-600 font-medium">
                    ⚠️ Needs approval
                  </span>
                  <div className="text-[0.65rem] text-red-600 space-y-0.5">
                    {getPlayerApprovalReason(player, team).map(
                      (reason, idx) => (
                        <div key={idx} className="flex items-start gap-1">
                          <span className="text-red-500">•</span>
                          <span>{reason}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const handleBulkApprove = async () => {
    if (!hasSelectedRows) return;

    setIsPerformingAction(true);
    try {
      const teamIds = selectedRows.map((row) => row.team_id);
      await bulkApprove(teamIds);
      toast.success(`Successfully approved ${teamIds.length} team(s)`);
      setRowSelection({});
    } catch (error) {
      toast.error("Failed to approve teams");
      console.error("Bulk approve error:", error);
    } finally {
      setIsPerformingAction(false);
    }
  };

  const handleManualValidityCheck = async () => {
    if (!hasSelectedRows) return;

    setIsPerformingAction(true);
    try {
      const teamIds = selectedRows.map((row) => row.team_id);
      await manualValidityCheck(teamIds);
      toast.success(`Successfully validated ${teamIds.length} team(s)`);
      setRowSelection({});
    } catch (error) {
      toast.error("Failed to manually validate teams");
      console.error("Manual validity check error:", error);
    } finally {
      setIsPerformingAction(false);
    }
  };

  const handleToggleAllRows = () => {
    if (tableRef.current) {
      const newState = !isAllRowsExpanded;
      tableRef.current.toggleAllRowsExpanded();
      setIsAllRowsExpanded(newState);
    }
  };

  return (
    <div className="space-y-4" data-testid="registered-teams-list">
      {!seasonId && (
        <div className="text-center py-8 text-muted-foreground">
          Please select a season from the sidebar to view registered teams.
        </div>
      )}

      {seasonId && isLoading && (
        <div className="bg-card rounded-md overflow-hidden">
          <TableSkeleton rows={10} columns={8} showHeader={false} />
        </div>
      )}

      {seasonId && error && (
        <div className="text-red-500 text-center py-8">
          Failed to load registered teams.
        </div>
      )}

      {seasonId &&
        !isLoading &&
        !error &&
        (!registeredTeams || registeredTeams.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            No registered teams found.
          </div>
        )}

      {seasonId &&
        !isLoading &&
        !error &&
        registeredTeams &&
        registeredTeams.length > 0 && (
          <>
            {/* Bulk Actions */}
            {hasSelectedRows && (
              <div className="bg-card rounded-md p-4 border">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {selectedRows.length} team(s) selected
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleBulkApprove}
                      disabled={isPerformingAction}
                      variant="default"
                      data-testid="bulk-approve-selected"
                    >
                      {isPerformingAction ? (
                        <>
                          <Spinner className="w-4 h-4 mr-2" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve Selected
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleManualValidityCheck}
                      disabled={isPerformingAction}
                      variant="default"
                      data-testid="manual-validity-selected"
                    >
                      {isPerformingAction ? (
                        <>
                          <Spinner className="w-4 h-4 mr-2" />
                          Validating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Validate Selected
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="bg-card rounded-md overflow-hidden">
              <div className="flex items-center justify-between p-2">
                <div className="text-sm text-muted-foreground">
                  Total teams: {registeredTeams.length}
                </div>
                <Button
                  onClick={handleToggleAllRows}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {isAllRowsExpanded ? (
                    <>
                      <ChevronsUp className="w-4 h-4" />
                      Collapse All
                    </>
                  ) : (
                    <>
                      <ChevronsDown className="w-4 h-4" />
                      Expand All
                    </>
                  )}
                </Button>
              </div>
              <TanStackTableWrapper
                data={registeredTeams ?? []}
                columns={columns}
                getExpandedRowModel={getExpandedRowModel()}
                getSortedRowModel={getSortedRowModel()}
                getFilteredRowModel={getFilteredRowModel()}
                sorting={sorting}
                onSortingChange={setSorting}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                getRowCanExpand={() => true}
                enableRowSelection={true}
                debugTable={false}
                onTableReady={(table) => {
                  tableRef.current = table;
                  // Sync initial state
                  setIsAllRowsExpanded(table.getIsAllRowsExpanded());
                }}
                showPagination={false}
                enableRowExpansion={true}
                renderExpandedRow={renderExpandedRow}
              />
            </div>
          </>
        )}
    </div>
  );
};
