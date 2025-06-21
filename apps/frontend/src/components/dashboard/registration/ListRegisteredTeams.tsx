"use client";

import { useRegisteredTeams } from "@/hooks/data/dashboard/useRegisteredTeams";
import { Spinner } from "@/components/ui/icons";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper
} from "@tanstack/react-table";
import type { SeasonRegisteredTeamsWithPlayers } from "@eggosystem/types";
import { useMemo } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { envConfig } from "@/configs/env";
import { SeasonPlatform } from "@eggosystem/types";
import type { CellContext } from "@tanstack/react-table";
import Link from "next/link";

export const ListRegisteredTeams = () => {
  const { registeredTeams, isLoading, error } = useRegisteredTeams();

  const columnHelper = createColumnHelper<SeasonRegisteredTeamsWithPlayers>();

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
      columnHelper.accessor("team_name", {
        header: () => "Team",
        cell: (info) => (
          <span className="font-medium text-foreground">{info.getValue()}</span>
        ),
        meta: { className: "text-left" }
      }),
      columnHelper.accessor("approved", {
        header: () => "Approved",
        cell: (info) =>
          info.getValue() ? (
            <span className="text-green-600 font-bold">Yes</span>
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
          info: CellContext<SeasonRegisteredTeamsWithPlayers, string | null>
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
      }),
      columnHelper.accessor("captain_nickname", {
        header: () => "Captain",
        cell: (info) =>
          info.getValue() ? (
            <span>{info.getValue()}</span>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
        meta: { className: "text-center" }
      }),
      columnHelper.accessor("co_captain_nickname", {
        header: () => "Co-Captain",
        cell: (info) =>
          info.getValue() ? (
            <span>{info.getValue()}</span>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
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
    getRowCanExpand: () => true,
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
    <div className="bg-card rounded-md overflow-hidden">
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
                      {row.original.players.map((player) => (
                        <div
                          key={player.steam_id}
                          className="flex flex-col gap-1 p-3 bg-background rounded border border-border min-w-[180px] max-w-full md:max-w-xs shadow-sm"
                        >
                          <span className="font-semibold text-foreground break-words">
                            {player.nickname}
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
