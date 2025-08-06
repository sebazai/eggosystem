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
  flexRender,
  createColumnHelper,
  getFilteredRowModel
} from "@tanstack/react-table";
import type { SeasonRegisteredTeamsWithPlayersValidatedTeams } from "@eggosystem/types";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  CheckCircle
} from "lucide-react";
import { envConfig } from "@/configs/env";
import { SeasonPlatform } from "@eggosystem/types";
import type { CellContext } from "@tanstack/react-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const ListRegisteredTeams = () => {
  const { registeredTeams, isLoading, error } = useRegisteredTeams();
  const { bulkApprove } = useBulkApproveTeams();
  const { manualValidityCheck } = useManualValidityCheck();
  const [rowSelection, setRowSelection] = useState({});
  const [isPerformingAction, setIsPerformingAction] = useState(false);

  const columnHelper =
    createColumnHelper<SeasonRegisteredTeamsWithPlayersValidatedTeams>();

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="w-4 h-4"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="w-4 h-4"
          />
        ),
        meta: { className: "text-center" }
      }),
      columnHelper.display({
        id: "expander",
        header: () => null,
        cell: ({ row }) =>
          row.getCanExpand() ? (
            <button
              className="flex items-center justify-center w-6 h-6"
              onClick={row.getToggleExpandedHandler()}
              aria-label={row.getIsExpanded() ? "Collapse" : "Expand"}
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : null,
        meta: { className: "text-center" }
      }),
      columnHelper.accessor("team_name", {
        header: () => "Team",
        cell: (info) => (
          <span className="font-medium text-foreground">{info.getValue()}</span>
        ),
        meta: { className: "text-left" }
      }),
      columnHelper.accessor("is_valid", {
        header: () => "Valid",
        cell: (info) =>
          info.getValue() ? (
            <span className="text-green-600 font-bold">Yes</span>
          ) : (
            <span className="text-red-500 font-bold">No</span>
          ),
        meta: { className: "text-center" }
      }),
      columnHelper.accessor("approved", {
        header: () => "Approved",
        cell: (info) =>
          info.getValue() ? (
            <span className="text-green-600 font-bold flex items-center justify-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Yes
            </span>
          ) : (
            <span className="text-red-500 font-bold">No</span>
          ),
        meta: { className: "text-center" }
      }),
      columnHelper.accessor("terms_and_conditions_approved", {
        header: () => "Terms",
        cell: (info) =>
          info.getValue() ? (
            <span className="text-green-600 font-bold">Yes</span>
          ) : (
            <span className="text-red-500 font-bold">No</span>
          ),
        meta: { className: "text-center" }
      }),
      columnHelper.accessor("external_platform_id", {
        header: () => "Platform ID",
        cell: (
          info: CellContext<
            SeasonRegisteredTeamsWithPlayersValidatedTeams,
            string | null
          >
        ) => {
          const row = info.row.original;
          const platform = row.season_platform;
          const id = info.getValue();
          if (!id) return <span className="text-muted-foreground">-</span>;
          let url: string | null = null;
          if (platform === SeasonPlatform.FACEIT) {
            url = `https://www.faceit.com/en/teams/${id}`;
          } else if (platform === SeasonPlatform.Esportal) {
            url = `https://esportal.com/team/${id}`;
          } else if (platform === SeasonPlatform.PopFlash) {
            url = `https://popflash.site/team/${id}`;
          } else if (platform === SeasonPlatform.Kanaliiga) {
            url = `/teams/${id}`;
          }
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
        meta: { className: "text-center" }
      })
    ],
    [columnHelper]
  );

  const table = useReactTable({
    data: registeredTeams ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowCanExpand: () => true,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection
    },
    debugTable: false
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelectedRows = selectedRows.length > 0;

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
        <div className="text-sm text-muted-foreground p-2">
          Total teams: {registeredTeams.length}
        </div>
        <div className="overflow-x-auto">
          <table className="text-xs w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="bg-kanaliiga-light-brown/30 uppercase text-kanaliiga-orange"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={
                        "px-3 py-2 font-semibold " +
                        ((
                          header.column.columnDef.meta as { className?: string }
                        )?.className || "text-left")
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => [
                <tr
                  key={row.id}
                  className={`border-b border-border hover:bg-kanaliiga-light-brown/10 ${
                    row.getIsSelected() ? "bg-kanaliiga-light-brown/20" : ""
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={
                        "px-3 py-2 " +
                        ((cell.column.columnDef.meta as { className?: string })
                          ?.className || "text-left")
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>,
                row.getIsExpanded() && (
                  <tr key={row.id + "-expanded"}>
                    <td
                      colSpan={columns.length}
                      className="bg-kanaliiga-light-brown/10 px-3 py-4"
                    >
                      {/* Team Leadership */}
                      <div className="mb-4">
                        <div className="font-semibold mb-2 text-kanaliiga-orange">
                          Team Leadership
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          {row.original.captain_nickname && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Captain:</span>
                              <span>{row.original.captain_nickname}</span>
                            </div>
                          )}
                          {row.original.co_captain_nickname && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Co-Captain:</span>
                              <span>{row.original.co_captain_nickname}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Players */}
                      <div className="font-semibold mb-2 text-kanaliiga-orange">
                        Players
                      </div>
                      <div className="flex flex-wrap gap-3 md:gap-4">
                        {row.original.players.map((player) => {
                          const isInvalid = row.original.invalid_players.some(
                            (invalidPlayer) =>
                              invalidPlayer.steam_id === player.steam_id
                          );

                          return (
                            <div
                              key={player.steam_id}
                              className={`flex flex-col gap-1 p-3 bg-background rounded border min-w-[200px] max-w-full md:max-w-xs shadow-sm ${
                                isInvalid
                                  ? "border-red-500 bg-red-50/50"
                                  : "border-border"
                              }`}
                            >
                              <span className="font-semibold text-foreground break-words">
                                {player.nickname}
                              </span>
                              <span className="text-[0.65rem] text-muted-foreground break-words">
                                {player.work_email}
                                {player.is_work_email_personal_email ? (
                                  <span className="text-orange-600 ml-1">
                                    (Personal)
                                  </span>
                                ) : (
                                  <span className="text-green-600 ml-1">
                                    (Work)
                                  </span>
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
                    </td>
                  </tr>
                )
              ])}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
