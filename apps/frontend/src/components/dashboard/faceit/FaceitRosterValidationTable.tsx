"use client";

import {
  getExpandedRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState
} from "@tanstack/react-table";
import type {
  FaceitTeamRosterComparison,
  CustomColumnMeta
} from "@eggosystem/types";
import { useMemo, useState } from "react";
import { ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TanStackTableWrapper } from "../../tables/TanStackTableWrapper";
import { ExpandableRow } from "../../tables/ExpandableRow";

interface FaceitRosterValidationTableProps {
  teams: FaceitTeamRosterComparison[];
  championshipId?: string | null;
  stageName?: string;
  seasonId?: number;
}

export const FaceitRosterValidationTable = ({
  teams,
  championshipId,
  stageName = "Championship",
  seasonId
}: FaceitRosterValidationTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<FaceitTeamRosterComparison>[]>(
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
        accessorKey: "team_name",
        header: "Team",
        cell: ({ getValue, row }) => {
          const teamName = getValue<string>();
          const faceitTeamUrl = row.original.faceit_team_url;
          const teamId = row.original.team_id;

          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{teamName}</span>
                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 rounded font-medium">
                  {stageName}
                </span>
                {faceitTeamUrl && (
                  <Link
                    href={faceitTeamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Link
                  href={`/teams/${teamId}${seasonId ? `?seasons=${seasonId}` : ""}`}
                  className="text-muted-foreground hover:text-foreground hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View in HUB
                </Link>
              </div>
            </div>
          );
        },
        meta: {
          responsive: "table-cell",
          tooltip: "Team Name",
          sortable: true
        } satisfies CustomColumnMeta
      },
      {
        accessorKey: "has_mismatches",
        header: "Status",
        cell: ({ getValue, row }) => {
          const hasMismatches = getValue<boolean>();
          const hasNotifications =
            row.original.players_in_hub_not_in_faceit.length > 0;

          if (hasMismatches) {
            return (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="w-3 h-3" />
                Rule Violation
              </Badge>
            );
          }

          if (hasNotifications) {
            return (
              <Badge
                variant="outline"
                className="gap-1 text-blue-600 border-blue-400"
              >
                <AlertCircle className="w-3 h-3" />
                Info
              </Badge>
            );
          }

          return (
            <Badge variant="outline" className="gap-1 text-green-600">
              <CheckCircle className="w-3 h-3" />
              Match
            </Badge>
          );
        },
        meta: {
          responsive: "table-cell",
          tooltip: "Roster Match Status",
          sortable: true
        } satisfies CustomColumnMeta
      },
      {
        accessorKey: "players_in_faceit_not_in_hub",
        header: "Rule Violations",
        cell: ({ getValue }) => {
          const violations =
            getValue<
              FaceitTeamRosterComparison["players_in_faceit_not_in_hub"]
            >();

          if (violations.length === 0) {
            return <span className="text-muted-foreground">-</span>;
          }

          return (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="w-3 h-3" />
              {violations.length}
            </Badge>
          );
        },
        meta: {
          responsive: "hidden md:table-cell",
          tooltip:
            "Players in FaceIt but NOT in HUB (can play but violates rules)",
          sortable: true
        } satisfies CustomColumnMeta
      },
      {
        accessorKey: "players_in_hub_not_in_faceit",
        header: "Notifications",
        cell: ({ getValue }) => {
          const notifications =
            getValue<
              FaceitTeamRosterComparison["players_in_hub_not_in_faceit"]
            >();

          if (notifications.length === 0) {
            return <span className="text-muted-foreground">-</span>;
          }

          return (
            <Badge
              variant="outline"
              className="gap-1 text-blue-600 border-blue-400"
            >
              <AlertCircle className="w-3 h-3" />
              {notifications.length}
            </Badge>
          );
        },
        meta: {
          responsive: "hidden md:table-cell",
          tooltip:
            "Players in HUB but NOT in FaceIt (informational - can't play but not a rule violation)",
          sortable: true
        } satisfies CustomColumnMeta
      },
      {
        accessorKey: "matching_players",
        header: "Matching",
        cell: ({ getValue }) => {
          const matching =
            getValue<FaceitTeamRosterComparison["matching_players"]>();

          return (
            <span className="text-green-600 font-medium">
              {matching.length}
            </span>
          );
        },
        meta: {
          responsive: "hidden lg:table-cell",
          tooltip: "Players matching in both systems",
          sortable: true
        } satisfies CustomColumnMeta
      }
    ],
    [seasonId, stageName]
  );

  const renderExpandedRow = (team: FaceitTeamRosterComparison) => {
    // Use team-specific championship if available, otherwise fall back to season championship
    const teamChampionshipId = team.championship_id || championshipId;

    return (
      <div className="space-y-4">
        {/* Championship Stage Indicator */}
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-muted-foreground">
            Championship Stage:
          </span>
          <span className="px-3 py-1.5 bg-purple-600 text-white rounded-lg font-semibold text-sm">
            {stageName}
          </span>
          <span className="text-xs text-muted-foreground italic">
            (All violations below are for this stage)
          </span>
        </div>

        {/* Verification Links Section */}
        {(team.faceit_team_url || teamChampionshipId) && (
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Manual Verification Links
            </div>
            <div className="flex flex-wrap gap-3">
              {team.faceit_team_url && (
                <Link
                  href={team.faceit_team_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View FaceIt Team
                </Link>
              )}
              {teamChampionshipId && (
                <Link
                  href={`https://www.faceit.com/en/championship/${teamChampionshipId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View {stageName}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Rule Violations - Players in FaceIt but NOT in HUB */}
        {team.players_in_faceit_not_in_hub.length > 0 && (
          <div>
            <div className="font-semibold mb-2 text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Rule Violations (In FaceIt, NOT in HUB)
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              These players can play matches but are NOT registered in the HUB -
              violates Kanaliiga rules
            </div>
            <div className="flex flex-wrap gap-3">
              {team.players_in_faceit_not_in_hub.map((player) => (
                <div
                  key={player.steam_id}
                  className="flex flex-col gap-1 p-3 bg-background rounded border border-red-500 min-w-[200px] shadow-sm"
                >
                  <span className="font-semibold text-foreground">
                    {player.nickname}
                  </span>
                  <Link
                    href={`https://www.faceit.com/en/players/${player.faceit_user_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View FaceIt Profile
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    Steam ID: {player.steam_id}
                  </span>
                  <span className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Not in HUB roster
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications - In HUB but NOT in FaceIt */}
        {team.players_in_hub_not_in_faceit.length > 0 && (
          <div>
            <div className="font-semibold mb-2 text-blue-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Notifications (In HUB, NOT in FaceIt)
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              These players are registered in HUB but are NOT in the FaceIt team
              - they cannot play matches (informational only, not a rule
              violation)
            </div>
            <div className="flex flex-wrap gap-3">
              {team.players_in_hub_not_in_faceit.map((player) => (
                <div
                  key={player.steam_id}
                  className="flex flex-col gap-1 p-3 bg-background rounded border border-blue-400 min-w-[200px] shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      {player.nickname}
                    </span>
                    {player.role === "substitute" && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        SUB
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Steam ID: {player.steam_id}
                  </span>
                  <span className="text-xs text-blue-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Not in FaceIt roster
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Matching Players */}
        {team.matching_players.length > 0 && (
          <div>
            <div className="font-semibold mb-2 text-green-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Matching Players ({team.matching_players.length})
            </div>
            <div className="flex flex-wrap gap-3">
              {team.matching_players.map((player) => (
                <div
                  key={player.steam_id}
                  className="flex flex-col gap-1 p-3 bg-background rounded border border-green-500 min-w-[200px] shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      {player.nickname}
                    </span>
                    {player.role === "substitute" && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded">
                        SUB
                      </span>
                    )}
                  </div>
                  {player.faceit_nickname &&
                    player.faceit_nickname !== player.nickname && (
                      <span className="text-xs text-muted-foreground">
                        FaceIt: {player.faceit_nickname}
                      </span>
                    )}
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No players at all */}
        {team.players_in_faceit_not_in_hub.length === 0 &&
          team.players_in_hub_not_in_faceit.length === 0 &&
          team.matching_players.length === 0 && (
            <div className="text-muted-foreground text-sm">
              No players found for this team
            </div>
          )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {teams.length} team{teams.length !== 1 ? "s" : ""} found
        </div>
      </div>

      <TanStackTableWrapper
        data={teams}
        columns={columns}
        getExpandedRowModel={getExpandedRowModel()}
        getSortedRowModel={getSortedRowModel()}
        sorting={sorting}
        onSortingChange={setSorting}
        getRowCanExpand={() => true}
        debugTable={false}
        enableRowExpansion={true}
        renderExpandedRow={renderExpandedRow}
      />
    </div>
  );
};
