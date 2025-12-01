"use client";

import {
  useRegisteredTeams,
  useBulkApproveTeams,
  useManualValidityCheck
} from "@/hooks/data/dashboard/useRegisteredTeams";
import { Spinner } from "@/components/ui/spinner";
import {
  useReactTable,
  getCoreRowModel,
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
import { useMemo, useState } from "react";
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
import { BaseTable } from "../../tables/BaseTable";
import { ExpandableRow } from "../../tables/ExpandableRow";
import { RowSelection } from "../../tables/RowSelection";

export const ListRegisteredTeams = () => {
  const { registeredTeams, isLoading, error } = useRegisteredTeams();
  const { bulkApprove } = useBulkApproveTeams();
  const { manualValidityCheck } = useManualValidityCheck();
  const [rowSelection, setRowSelection] = useState({});
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);

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

  const table = useReactTable({
    data: registeredTeams ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    getRowCanExpand: () => true,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
      sorting
    },
    debugTable: false
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
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
              <span>{team.captain_nickname}</span>
            </div>
          )}
          {team.co_captain_nickname && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Co-Captain:</span>
              <span>{team.co_captain_nickname}</span>
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
              {isInvalid && (
                <span className="text-[0.65rem] text-red-600 font-medium">
                  ⚠️ Needs approval
                </span>
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
      const teamIds = selectedRows.map((row) => row.original.team_id);
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
      const teamIds = selectedRows.map((row) => row.original.team_id);
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
    table.toggleAllRowsExpanded();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        Failed to load registered teams.
      </div>
    );
  }

  if (!registeredTeams || registeredTeams.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No registered teams found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
            {table.getIsAllRowsExpanded() ? (
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
        <BaseTable
          table={table}
          showPagination={false}
          enableRowExpansion={true}
          enableRowSelection={true}
          renderExpandedRow={renderExpandedRow}
        />
      </div>
    </div>
  );
};
