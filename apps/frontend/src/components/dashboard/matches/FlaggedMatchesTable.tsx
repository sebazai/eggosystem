"use client";

import { useMemo, useState } from "react";
import {
  getSortedRowModel,
  type ColumnDef,
  type SortingState
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TanStackTableWrapper } from "../../tables/TanStackTableWrapper";
import type { FlaggedMatches } from "@eggosystem/types";
import { useFlaggedMatches } from "@/hooks/data/dashboard/useFlaggedMatches";
import { TeamBadge } from "./TeamBadge";
import { PlayerBadge } from "./PlayerBadge";
import { MatchIdBadge } from "./MatchIdBadge";
import { ExternalMatchIdBadge } from "./ExternalMatchIdBadge";

export const FlaggedMatchesTable = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { flaggedMatches, isLoading, error } = useFlaggedMatches();

  // TanStack Table column definitions
  const columns = useMemo<ColumnDef<FlaggedMatches>[]>(
    () => [
      {
        accessorKey: "external_match_id",
        header: "EXTERNAL MATCH ID",
        cell: ({ getValue }) => {
          const externalMatchId = getValue<string>();
          return externalMatchId ? (
            <ExternalMatchIdBadge externalMatchId={externalMatchId} />
          ) : (
            <span className="text-muted-foreground text-xs">None</span>
          );
        },
        meta: {
          responsive: "table-cell",
          tooltip: "External Match ID",
          sortable: true
        }
      },
      {
        accessorKey: "team_id",
        header: "TEAM",
        cell: ({ getValue }) => {
          const teamId = getValue<number>();
          return <TeamBadge teamId={teamId} />;
        },
        meta: {
          responsive: "table-cell",
          tooltip: "Team",
          sortable: true
        }
      },
      {
        accessorKey: "steam_ids",
        header: "PLAYERS",
        cell: ({ getValue }) => {
          const steamIds = getValue<string[]>();

          // Early return for undefined/null/empty cases
          if (!steamIds || steamIds.length === 0) {
            return <span className="text-muted-foreground text-xs">None</span>;
          }

          return (
            <div className="flex flex-wrap gap-1">
              {steamIds.map((steamId) => (
                <PlayerBadge
                  key={steamId}
                  steamId={steamId}
                  className="text-xs"
                />
              ))}
            </div>
          );
        },
        enableSorting: false,
        meta: {
          responsive: "table-cell",
          tooltip: "Players",
          sortable: false
        }
      },
      {
        accessorKey: "match_ids",
        header: "MATCH IDS",
        cell: ({ getValue }) => {
          const matchIds = getValue<number[]>();

          // Early return for undefined/null/empty cases
          if (!matchIds || matchIds.length === 0) {
            return <span className="text-muted-foreground text-xs">None</span>;
          }

          return (
            <div className="flex flex-wrap gap-1">
              {matchIds.map((matchId) => (
                <MatchIdBadge
                  key={matchId}
                  matchId={matchId}
                  className="text-xs"
                />
              ))}
            </div>
          );
        },
        enableSorting: false,
        meta: {
          responsive: "hidden md:table-cell",
          tooltip: "Match IDs",
          sortable: false
        }
      },
      {
        accessorKey: "players_added_for_this_match",
        header: "ADDED PLAYERS",
        cell: ({ getValue }) => {
          const addedPlayers = getValue<string[]>();

          // Early return for undefined/null/empty cases
          if (!addedPlayers || addedPlayers.length === 0) {
            return <span className="text-muted-foreground text-sm">None</span>;
          }

          return (
            <div className="flex flex-wrap gap-1">
              {addedPlayers.map((player) => (
                <PlayerBadge
                  key={player}
                  steamId={player}
                  variant="destructive"
                  className="text-xs"
                />
              ))}
            </div>
          );
        },
        enableSorting: false,
        meta: {
          responsive: "hidden lg:table-cell",
          tooltip: "Added Players",
          sortable: false
        }
      }
    ],
    []
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Flagged Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                Loading flagged matches...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Flagged Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-500 font-medium mb-2">
              Failed to load flagged matches
            </div>
            <p className="text-muted-foreground text-sm">
              Please try refreshing the page or contact support if the problem
              persists.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!flaggedMatches || flaggedMatches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Flagged Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              No flagged matches found
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              All matches appear to be clean - no suspicious activity detected.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Flagged Matches
          <Badge variant="secondary" className="ml-2">
            {flaggedMatches.length}{" "}
            {flaggedMatches.length === 1 ? "match" : "matches"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TanStackTableWrapper
          data={flaggedMatches ?? []}
          columns={columns}
          getSortedRowModel={getSortedRowModel()}
          sorting={sorting}
          onSortingChange={setSorting}
          showPagination={false}
        />
      </CardContent>
    </Card>
  );
};
