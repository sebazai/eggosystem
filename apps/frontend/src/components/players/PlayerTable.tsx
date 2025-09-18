"use client";

import React, { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import type { PlayerStatsTable } from "@eggosystem/types";
import { BaseTable } from "../tables/BaseTable";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  type PaginationState,
  type Cell
} from "@tanstack/react-table";

interface CustomColumnMeta {
  responsive?: string;
  tooltip?: string;
}

interface PlayerTableProps {
  players: PlayerStatsTable[];
  initialPageSize?: number;
  hideTeamName?: boolean;
}

export const PlayerTable: React.FC<PlayerTableProps> = ({
  players,
  initialPageSize,
  hideTeamName
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [sorting, setSorting] = useState<SortingState>([
    { id: "kana_rating", desc: true }
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize || 10
  });

  const playerName = searchParams.get("playerName") || "";

  const columns = useMemo<ColumnDef<PlayerStatsTable>[]>(
    () => [
      {
        accessorKey: "nickname",
        header: "PLAYER",
        cell: ({ getValue }) => (
          <div className="font-medium text-foreground">
            {getValue<string>()}
          </div>
        ),
        meta: {
          responsive: "table-cell",
          tooltip: "Player Nickname"
        }
      },
      ...(hideTeamName
        ? []
        : ([
            {
              accessorKey: "team_name",
              header: "TEAM",
              cell: ({ getValue }) => getValue(),
              meta: {
                responsive: "hidden md:table-cell",
                tooltip: "Team Name"
              }
            }
          ] satisfies ColumnDef<PlayerStatsTable>[])),
      {
        accessorKey: "maps_played",
        header: "MAPS",
        cell: ({ getValue }) => getValue(),
        meta: {
          responsive: "hidden md:table-cell",
          tooltip: "Number of Maps Played"
        }
      },
      {
        accessorKey: "kills",
        header: "K",
        cell: ({ getValue }) => getValue(),
        meta: {
          responsive: "table-cell",
          tooltip: "Total Kills"
        }
      },
      {
        accessorKey: "assists",
        header: "A (F)",
        cell: ({ row }) => (
          <>
            {row.original.assists}(
            <span className="text-xs">{row.original.flash_assists || 0}</span>)
          </>
        ),
        meta: {
          responsive: "hidden lg:table-cell",
          tooltip: "Total Assists (Flash Assists in parentheses)"
        }
      },
      {
        accessorKey: "deaths",
        header: "D",
        cell: ({ getValue }) => getValue(),
        meta: {
          responsive: "table-cell",
          tooltip: "Total Deaths"
        }
      },
      {
        accessorKey: "awp_kills",
        header: "AWP",
        cell: ({ getValue }) => getValue(),
        meta: {
          responsive: "hidden xl:table-cell",
          tooltip: "AWP Kills"
        }
      },
      {
        accessorKey: "utility_damage",
        header: "UD",
        cell: ({ getValue }) => getValue(),
        meta: {
          responsive: "hidden xl:table-cell",
          tooltip: "Utility Damage"
        }
      },
      {
        accessorKey: "headshots",
        header: "HS",
        cell: ({ getValue }) => getValue(),
        meta: {
          responsive: "hidden lg:table-cell",
          tooltip: "Headshots"
        }
      },
      {
        accessorKey: "first_kills",
        header: "FK",
        cell: ({ getValue }) => getValue(),
        meta: {
          responsive: "hidden xl:table-cell",
          tooltip: "First Kills"
        }
      },
      {
        accessorKey: "first_deaths",
        header: "FD",
        cell: ({ getValue }) => getValue(),
        meta: {
          responsive: "hidden xl:table-cell",
          tooltip: "First Deaths"
        }
      },
      {
        accessorKey: "adr",
        header: "ADR",
        cell: ({ getValue }) => getValue<number>()?.toFixed(1) || 0,
        meta: {
          responsive: "hidden md:table-cell",
          tooltip: "Average Damage per Round"
        }
      },
      {
        accessorKey: "hs_percent",
        header: "HS%",
        cell: ({ getValue }) => `${getValue<number>()?.toFixed(1) || 0}%`,
        meta: {
          responsive: "hidden lg:table-cell",
          tooltip: "Headshot Percentage"
        }
      },
      {
        accessorKey: "kd",
        header: "K/D",
        cell: ({ row }) => {
          const kd = row.original.kd;
          if (typeof kd === "number") {
            return kd.toFixed(2);
          }
          return (
            row.original.kills / Math.max(row.original.deaths, 1)
          ).toFixed(2);
        },
        meta: {
          responsive: "hidden md:table-cell",
          tooltip: "Kill/Death Ratio"
        }
      },
      {
        accessorKey: "kana_rating",
        header: "RATING",
        cell: ({ getValue }) => getValue<number>()?.toFixed(2) || 0,
        meta: {
          responsive: "table-cell",
          tooltip: "Kanarating"
        }
      }
    ],
    [hideTeamName]
  );

  // TanStack Table configuration
  const table = useReactTable({
    data: players || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination
    },
    initialState: {
      sorting: [{ id: "kana_rating", desc: true }],
      pagination: {
        pageIndex: 0,
        pageSize: initialPageSize || 10
      }
    }
  });

  // Reset pagination when players and playerName changes
  useEffect(() => {
    table.setPageIndex(0);
  }, [players, playerName, table]);

  const handleRowClick = (player: PlayerStatsTable) => {
    router.push(
      `/players/${encodeURIComponent(player.steam_id)}?${searchParams.toString()}`
    );
  };

  const handleRowMiddleClick = (player: PlayerStatsTable) => {
    const url = `/players/${encodeURIComponent(player.steam_id)}?${searchParams.toString()}`;
    window.open(url, "_blank");
  };

  const customCellClassName = (
    cell: Cell<PlayerStatsTable, unknown>,
    _row: PlayerStatsTable
  ) => {
    return cn(
      "px-3 py-2 text-center",
      (cell.column.columnDef.meta as CustomColumnMeta)?.responsive,
      cell.column.id === "kana_rating" && "text-muted-foreground"
    );
  };

  return (
    <BaseTable
      table={table}
      columns={columns}
      onRowClick={handleRowClick}
      onRowMiddleClick={handleRowMiddleClick}
      showPagination={players && players.length > (initialPageSize ?? 0)}
      paginationType="players"
      customCellClassName={customCellClassName}
    />
  );
};
