"use client";

import React, { useMemo, useState } from "react";

import {
  cn,
  convertSeasonToS,
  mapToReadableNameCapitalFirst
} from "@/lib/utils";
import { format } from "date-fns";
import { BaseTable } from "../tables/BaseTable";
import { usePlayerMatchHistory } from "@/hooks/data/filtered/usePlayerMatchHistory";

import { useFilters } from "@/context/FilterContext";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type PaginationState,
  type Cell
} from "@tanstack/react-table";
import type { MatchHistoryResult } from "@eggosystem/types";

interface CustomColumnMeta {
  responsive?: string;
  tooltip?: string;
  sortable?: boolean;
}

interface PlayerDetailsProps {
  steamId: string;
}

const PlayerMatchHistoryTableWrapper = ({
  children
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="bg-card rounded-md overflow-hidden">
      <h2 className="text-xl font-semibold mb-2">Match History</h2>
      {children}
    </div>
  );
};

export const PlayerMatchHistoryTable = ({ steamId }: PlayerDetailsProps) => {
  const { filterParams } = useFilters();

  const [sorting, setSorting] = useState<SortingState>([
    { id: "match_date", desc: true }
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  });

  const { matchHistory, isLoading, isError } = usePlayerMatchHistory({
    steamId,
    ...filterParams
  });

  // TanStack Table column definitions
  const columns = useMemo<ColumnDef<MatchHistoryResult>[]>(
    () => [
      {
        accessorKey: "opponent_name",
        header: "OPPONENT",
        cell: ({ getValue }) => getValue<string>(),
        meta: {
          responsive: "table-cell",
          tooltip: "Opponent Team",
          sortable: true
        }
      },
      {
        accessorKey: "match_date",
        header: "DATE",
        cell: ({ getValue }) => {
          const date = getValue<string>();
          return date ? format(new Date(date), "dd.MM.yyyy") : "N/A";
        },
        meta: {
          responsive: "hidden md:table-cell",
          tooltip: "Match Date",
          sortable: true
        }
      },
      {
        accessorKey: "season_name",
        header: "SEASON",
        cell: ({ getValue }) => convertSeasonToS(getValue<string>()),
        meta: {
          responsive: "hidden lg:table-cell",
          tooltip: "Season",
          sortable: true
        }
      },
      {
        id: "map_league",
        header: "MAPS/LEAGUE",
        cell: ({ row }) => {
          const mapName = row.original.map_name
            .split(", ")
            .map((name) => mapToReadableNameCapitalFirst(name))
            .join(", ");
          return `${mapName} • ${row.original.league_name}`;
        },
        meta: {
          responsive: "hidden lg:table-cell",
          tooltip: "Map and League",
          sortable: false
        }
      },
      {
        id: "score",
        header: "SCORE",
        cell: ({ row }) => {
          const teamWon = row.original.score > row.original.opponent_score;
          return (
            <>
              <span className={teamWon ? "text-green-500" : "text-red-500"}>
                {row.original.score}
              </span>
              -
              <span className={!teamWon ? "text-green-500" : "text-red-500"}>
                {row.original.opponent_score}
              </span>
            </>
          );
        },
        meta: {
          responsive: "hidden sm:table-cell",
          tooltip: "Match Score (Opponent score on right)",
          sortable: true
        }
      },
      {
        accessorKey: "kana_rating",
        header: "RATING",
        cell: ({ getValue }) => getValue<number>()?.toFixed(2),
        meta: {
          responsive: "table-cell",
          tooltip: "Kanaliiga Rating",
          sortable: true
        }
      },
      {
        accessorKey: "kills",
        header: "K",
        cell: ({ getValue }) => getValue<number>(),
        meta: {
          responsive: "table-cell",
          tooltip: "Kills",
          sortable: true
        }
      },
      {
        accessorKey: "assists",
        header: "A (f)",
        cell: ({ row }) => (
          <>
            {row.original.assists} (
            <span className="text-xs">{row.original.flash_assists}</span>)
          </>
        ),
        meta: {
          responsive: "hidden md:table-cell",
          tooltip: "Assists (Flash Assists)",
          sortable: true
        }
      },
      {
        accessorKey: "deaths",
        header: "D",
        cell: ({ getValue }) => getValue<number>(),
        meta: {
          responsive: "table-cell",
          tooltip: "Deaths",
          sortable: true
        }
      },
      {
        accessorKey: "kd",
        header: "K/D",
        cell: ({ getValue }) => getValue<number>()?.toFixed(2),
        meta: {
          responsive: "hidden md:table-cell",
          tooltip: "Kill/Death Ratio",
          sortable: true
        }
      },
      {
        accessorKey: "awp_kills",
        header: "AWP",
        cell: ({ getValue }) => getValue<number>(),
        meta: {
          responsive: "hidden lg:table-cell",
          tooltip: "AWP Kills",
          sortable: true
        }
      },
      {
        accessorKey: "utility_damage",
        header: "UD",
        cell: ({ getValue }) => getValue<number>(),
        meta: {
          responsive: "hidden lg:table-cell",
          tooltip: "Utility Damage",
          sortable: true
        }
      },
      {
        accessorKey: "headshots",
        header: "HS",
        cell: ({ getValue }) => getValue<number>(),
        meta: {
          responsive: "hidden lg:table-cell",
          tooltip: "Headshots",
          sortable: true
        }
      },
      {
        accessorKey: "first_kills",
        header: "FK",
        cell: ({ getValue }) => getValue<number>(),
        meta: {
          responsive: "hidden lg:table-cell",
          tooltip: "First Kills",
          sortable: true
        }
      },
      {
        accessorKey: "first_deaths",
        header: "FD",
        cell: ({ getValue }) => getValue<number>(),
        meta: {
          responsive: "hidden lg:table-cell",
          tooltip: "First Deaths",
          sortable: true
        }
      },
      {
        accessorKey: "adr",
        header: "ADR",
        cell: ({ getValue }) => getValue<number>()?.toFixed(1),
        meta: {
          responsive: "table-cell",
          tooltip: "Average Damage per Round",
          sortable: true
        }
      },
      {
        accessorKey: "hs_percent",
        header: "HS%",
        cell: ({ getValue }) => `${getValue<number>()?.toFixed(1)}%`,
        meta: {
          responsive: "hidden md:table-cell",
          tooltip: "Headshot Percentage",
          sortable: true
        }
      }
    ],
    []
  );

  // TanStack Table configuration
  const table = useReactTable({
    data: matchHistory || [],
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
      sorting: [{ id: "match_date", desc: true }],
      pagination: {
        pageIndex: 0,
        pageSize: 10
      }
    }
  });

  const handleRowClick = (match: MatchHistoryResult) => {
    const url = match.match_game_id
      ? `/matches/${match.match_id}/games/${match.match_game_id}`
      : `/matches/${match.match_id}`;
    window.open(url, "_blank");
  };

  const handleRowMiddleClick = (match: MatchHistoryResult) => {
    const url = match.match_game_id
      ? `/matches/${match.match_id}/games/${match.match_game_id}`
      : `/matches/${match.match_id}`;
    window.open(url, "_blank");
  };

  const customCellClassName = (
    cell: Cell<MatchHistoryResult, unknown>,
    _row: MatchHistoryResult
  ) => {
    return cn(
      "px-3 py-2 text-center",
      (cell.column.columnDef.meta as CustomColumnMeta)?.responsive,
      cell.column.id === "opponent_name" && "text-left",
      cell.column.id === "kana_rating" && "font-bold"
    );
  };

  const customCellContent = (
    cell: Cell<MatchHistoryResult, unknown>,
    row: MatchHistoryResult
  ) => {
    if (cell.column.id === "opponent_name") {
      const teamWon = row.score > row.opponent_score;
      return (
        <>
          <span>{row.opponent_name}</span>
          {/* Score on mobile - hidden on desktop */}
          <div className="sm:hidden text-xs mt-1">
            <span className={teamWon ? "text-green-500" : "text-red-500"}>
              {row.score}
            </span>
            -
            <span className={!teamWon ? "text-green-500" : "text-red-500"}>
              {row.opponent_score}
            </span>
          </div>
        </>
      );
    }

    return flexRender(cell.column.columnDef.cell, cell.getContext());
  };

  if (isError) {
    return (
      <PlayerMatchHistoryTableWrapper>
        <p className="text-muted-foreground">
          There was an error loading the player match history. Please try again
          later or adjust your filters.
        </p>
      </PlayerMatchHistoryTableWrapper>
    );
  }

  if (isLoading) {
    return (
      <PlayerMatchHistoryTableWrapper>
        <div className="text-center">
          <div className="h-6 w-40 bg-kanaliiga-light-brown/30 animate-pulse rounded mx-auto mb-3" />
          <div className="h-4 w-60 bg-kanaliiga-light-brown/30 animate-pulse rounded mx-auto" />
        </div>
      </PlayerMatchHistoryTableWrapper>
    );
  }

  if (matchHistory?.length === 0) {
    return (
      <PlayerMatchHistoryTableWrapper>
        <div className="text-center text-muted-foreground">
          No match history available for this player with the current filters.
        </div>
      </PlayerMatchHistoryTableWrapper>
    );
  }

  return (
    <PlayerMatchHistoryTableWrapper>
      <BaseTable
        table={table}
        columns={columns}
        onRowClick={handleRowClick}
        onRowMiddleClick={handleRowMiddleClick}
        showPagination={table.getFilteredRowModel().rows.length > 0}
        paginationType="matches"
        customCellClassName={customCellClassName}
        customCellContent={customCellContent}
      />
    </PlayerMatchHistoryTableWrapper>
  );
};
