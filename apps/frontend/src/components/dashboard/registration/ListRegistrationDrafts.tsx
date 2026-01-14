"use client";

import { useRegistrationDrafts } from "@/hooks/data/dashboard/useRegistrationDrafts";
import { useDashboardSeason } from "@/hooks/data/dashboard/useDashboardSeason";
import { Spinner } from "@/components/ui/spinner";
import { useMemo, useState } from "react";
import {
  getExpandedRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState
} from "@tanstack/react-table";
import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";
import {
  type RegistrationDraftRaw,
  type CustomColumnMeta,
  type PlayerValidationResult
} from "@eggosystem/types";
import { TanStackTableWrapper } from "../../tables/TanStackTableWrapper";
import { ExpandableRow } from "../../tables/ExpandableRow";
import { clientApiFetch } from "@/lib/apiClient";
import { getPlayerValidationErrors } from "@/utils/playerValidation";
import { AlertTriangle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";

export const ListRegistrationDrafts = () => {
  const { selectedSeasonId } = useDashboardSeason();
  const seasonId = selectedSeasonId ? Number(selectedSeasonId) : null;
  const { registrationDrafts, isLoading, error } = useRegistrationDrafts(
    seasonId ?? 0
  );
  const [sorting, setSorting] = useState<SortingState>([]);

  if (!seasonId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Please select a season from the sidebar to view registration drafts.
      </div>
    );
  }

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
            (p: {
              captain?: boolean;
              nickname?: string;
              discord?: string | null;
            }) => p.captain
          );
          if (!captain) {
            return <span className="text-muted-foreground">-</span>;
          }
          return (
            <span>
              {captain.discord || captain.nickname}
              {captain.discord && (
                <span className="text-muted-foreground ml-1 text-xs">
                  ({captain.nickname})
                </span>
              )}
            </span>
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
            (p: {
              coCaptain?: boolean;
              nickname?: string;
              discord?: string | null;
            }) => p.coCaptain
          );
          if (!coCaptain) {
            return <span className="text-muted-foreground">-</span>;
          }
          return (
            <span>
              {coCaptain.discord || coCaptain.nickname}
              {coCaptain.discord && (
                <span className="text-muted-foreground ml-1 text-xs">
                  ({coCaptain.nickname})
                </span>
              )}
            </span>
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
          <PlayerCard key={player.accountId} player={player} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-card rounded-md overflow-hidden mt-8">
      <div className="overflow-x-auto">
        <div>In progress length: {registrationDrafts.length}</div>
        <TanStackTableWrapper
          data={registrationDrafts ?? []}
          columns={columns}
          getExpandedRowModel={getExpandedRowModel()}
          getSortedRowModel={getSortedRowModel()}
          sorting={sorting}
          onSortingChange={setSorting}
          getRowCanExpand={(row) =>
            Array.isArray(row.original.players) &&
            row.original.players.length > 0
          }
          debugTable={false}
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

// Subcomponent for player card with validation warnings
const PlayerCard = ({
  player
}: {
  player: {
    accountId: number;
    steamId: string;
    nickname: string;
    discord?: string | null;
    captain?: boolean;
    coCaptain?: boolean;
  };
}) => {
  // Get season from shared selector
  const { selectedSeasonId } = useDashboardSeason();
  const seasonId = selectedSeasonId ? Number(selectedSeasonId) : null;

  // Fetch validation for this player
  const { data: validationResult } = useSWR<PlayerValidationResult>(
    seasonId && player.steamId
      ? `/api/v1/dashboard/players/${player.steamId}/validate?season_id=${seasonId}`
      : null,
    clientApiFetch,
    { revalidateOnFocus: false }
  );

  const validationErrors = getPlayerValidationErrors(validationResult);

  // Check if captain/co-captain needs Discord linked
  // If player.discord is null/undefined/empty, Discord is not linked
  const isCaptainOrCoCaptain = player.captain || player.coCaptain;
  const discordLinked = Boolean(player.discord);
  const needsDiscordLink = isCaptainOrCoCaptain && !discordLinked;

  // Combine all warnings
  const allWarnings: string[] = [...validationErrors];
  if (needsDiscordLink) {
    allWarnings.push(
      "Captains and co-captains must link their Discord account in their profile."
    );
  }

  const hasWarnings = allWarnings.length > 0;

  return (
    <div className="flex flex-col gap-1 p-3 bg-background rounded border border-border min-w-[180px] max-w-full md:max-w-xs shadow-sm">
      <span className="font-semibold text-foreground break-words">
        {player.discord || player.nickname}
        {player.discord && (
          <span className="text-muted-foreground ml-1 text-xs block">
            ({player.nickname})
          </span>
        )}
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
      {hasWarnings && (
        <div className="mt-1">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500 cursor-pointer hover:opacity-80 active:opacity-70 touch-manipulation"
                aria-label="View warnings"
              >
                <AlertTriangle className="h-4 w-4" />
                <span className="text-[0.65rem]">Warning</span>
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" className="max-w-xs">
              <div className="space-y-1">
                <div className="font-semibold mb-1">Warnings:</div>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  {allWarnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
};
