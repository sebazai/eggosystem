"use client";

import { useRegistrationDrafts } from "@/hooks/data/dashboard/useRegistrationDrafts";
import { Spinner } from "@/components/ui/icons";
import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState
} from "@tanstack/react-table";
import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";
import {
  type RegistrationDraftRaw,
  type CustomColumnMeta
} from "@eggosystem/types";
import { BaseTable } from "../../tables/BaseTable";
import { ExpandableRow } from "../../tables/ExpandableRow";

export const ListRegistrationDrafts = () => {
  const { registrationDrafts, isLoading, error } = useRegistrationDrafts();
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<RegistrationDraftRaw>[]>(
    () => [
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
        id: "team_name",
        header: "Team",
        cell: ({ row }) => <TeamNameCell draft={row.original} />,
        meta: {
          responsive: "table-cell",
          tooltip: "Team Name",
          sortable: true
        } satisfies CustomColumnMeta
      },
      {
        id: "captain_nickname",
        header: "Captain",
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
        meta: {
          responsive: "table-cell",
          tooltip: "Captain",
          sortable: true
        } satisfies CustomColumnMeta
      },
      {
        id: "co_captain_nickname",
        header: "Co-Captain",
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
        meta: {
          responsive: "table-cell",
          tooltip: "Co-Captain",
          sortable: true
        } satisfies CustomColumnMeta
      },
      {
        id: "platform_id",
        header: "Platform ID",
        cell: ({ row }) => {
          const draft = row.original;
          const id = draft.teamExternalId;
          return id ? (
            <span>{id}</span>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
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
    data: registrationDrafts ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    getRowCanExpand: (row) =>
      Array.isArray(row.original.players) && row.original.players.length > 0,
    state: {
      sorting
    },
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

  const renderExpandedRow = (draft: RegistrationDraftRaw) => (
    <div>
      <div className="font-semibold mb-2 text-kanaliiga-orange">Players</div>
      <div className="flex flex-wrap gap-3 md:gap-4">
        {draft.players?.map((player) => (
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
    </div>
  );

  return (
    <div className="bg-card rounded-md overflow-hidden mt-8">
      <div className="overflow-x-auto">
        <div>In progress length: {registrationDrafts.length}</div>
        <BaseTable
          table={table}
          showPagination={false}
          enableRowExpansion={true}
          renderExpandedRow={renderExpandedRow}
        />
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
