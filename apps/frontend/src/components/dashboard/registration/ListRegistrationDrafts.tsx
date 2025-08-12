"use client";

import { useRegistrationDrafts } from "@/hooks/data/dashboard/useRegistrationDrafts";
import { Spinner } from "@/components/ui/icons";
import { useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper
} from "@tanstack/react-table";
import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";
import { type RegistrationDraftRaw } from "@eggosystem/types";

export const ListRegistrationDrafts = () => {
  const { registrationDrafts, isLoading, error } = useRegistrationDrafts();
  const columnHelper = createColumnHelper<RegistrationDraftRaw>();

  const columns = useMemo(
    () => [
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
      columnHelper.display({
        id: "team_name",
        header: () => "Team",
        cell: ({ row }) => <TeamNameCell draft={row.original} />,
        meta: { className: "text-left" }
      }),
      columnHelper.display({
        id: "captain_nickname",
        header: () => "Captain",
        cell: ({ row }) => {
          const draft = row.original;
          const captain = draft.players?.find(
            (p: { captain?: boolean; nickname?: string }) => p.captain
          );
          return (
            captain?.nickname || (
              <span className="text-muted-foreground">-</span>
            )
          );
        },
        meta: { className: "text-center" }
      }),
      columnHelper.display({
        id: "co_captain_nickname",
        header: () => "Co-Captain",
        cell: ({ row }) => {
          const draft = row.original;
          const coCaptain = draft.players?.find(
            (p: { coCaptain?: boolean; nickname?: string }) => p.coCaptain
          );
          return (
            coCaptain?.nickname || (
              <span className="text-muted-foreground">-</span>
            )
          );
        },
        meta: { className: "text-center" }
      }),
      columnHelper.display({
        id: "platform_id",
        header: () => "Platform ID",
        cell: ({ row }) => {
          const draft = row.original;
          const id = draft.teamExternalId;
          return id ? (
            <span>{id}</span>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
        meta: { className: "text-center" }
      })
    ],
    [columnHelper]
  );

  const table = useReactTable({
    data: registrationDrafts ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: (row) =>
      Array.isArray(row.original.players) && row.original.players.length > 0,
    debugTable: false
  });

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
        Failed to load registration drafts.
      </div>
    );
  }

  if (!registrationDrafts || registrationDrafts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No registration drafts found.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-md overflow-hidden mt-8">
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
                      ((header.column.columnDef.meta as { className?: string })
                        ?.className || "text-left")
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
                className="border-b border-border hover:bg-kanaliiga-light-brown/10"
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>,
              row.getIsExpanded() && (
                <tr key={row.id + "-expanded"}>
                  <td
                    colSpan={columns.length}
                    className="bg-kanaliiga-light-brown/10 px-3 py-4"
                  >
                    <div className="font-semibold mb-2 text-kanaliiga-orange">
                      Players
                    </div>
                    <div className="flex flex-wrap gap-3 md:gap-4">
                      {row.original.players?.map((player) => (
                        <div
                          key={player.accountId}
                          className="flex flex-col gap-1 p-3 bg-background rounded border border-border min-w-[180px] max-w-full md:max-w-xs shadow-sm"
                        >
                          <span className="font-semibold text-foreground break-words">
                            {player.nickname}
                          </span>
                          <span className="text-[0.65rem] text-muted-foreground flex items-center gap-2 flex-wrap">
                            <a
                              href={`https://steamcommunity.com/profiles/${player.steamId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline flex items-center gap-1"
                            >
                              Steam
                            </a>
                            <span className="font-mono text-xs select-all break-all">
                              {player.steamId}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            ])}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Subcomponent for team name cell
const TeamNameCell = ({ draft }: { draft: RegistrationDraftRaw }) => {
  const teamId = draft.teamId ? String(draft.teamId) : null;
  const { data: team } = useSWR(
    teamId ? `/api/v1/filters/teams/${teamId}` : null,
    expressFetcher,
    { revalidateOnFocus: false }
  );
  if (
    draft.newTeam &&
    typeof draft.newTeam === "object" &&
    "name" in draft.newTeam &&
    typeof draft.newTeam.name === "string"
  ) {
    return (
      <span className="font-medium text-foreground">{draft.newTeam.name}</span>
    );
  }
  if (teamId) {
    if (
      team &&
      typeof team === "object" &&
      "name" in team &&
      typeof (team as { name: unknown }).name === "string"
    ) {
      return (
        <span className="font-medium text-foreground">
          {(team as { name: string }).name}
        </span>
      );
    }
    return <span className="text-muted-foreground">-</span>;
  }
  return <span className="text-muted-foreground">-</span>;
};
