"use client";

import { useTeamHistory } from "@/hooks/data/dashboard/useTeamHistory";
import { Spinner } from "@/components/ui/spinner";
import type { TeamHistoricalPerformance } from "@eggosystem/types";

interface TeamHistoryBadgeProps {
  seasonId: number | null;
  teamId: number;
}

/**
 * Compact badge showing team's historical performance across seasons
 * Displays as a list of past seasons with W-L record and avg round score
 */
export function TeamHistoryBadge({ seasonId, teamId }: TeamHistoryBadgeProps) {
  const { history, isLoading } = useTeamHistory(seasonId, teamId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="h-4 w-4" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <span className="text-xs text-muted-foreground italic">New roster</span>
    );
  }

  return (
    <div className="flex flex-col gap-1 text-xs max-h-[120px] overflow-y-auto">
      {history.map((record: TeamHistoricalPerformance) => (
        <div
          key={`${record.season_id}-${record.matched_team_id}`}
          className="flex items-center gap-1 whitespace-nowrap"
        >
          <span className="font-medium text-muted-foreground">
            {record.season_name}:
          </span>
          <span
            className={`font-semibold ${
              record.wins > record.losses
                ? "text-green-600 dark:text-green-400"
                : record.wins < record.losses
                  ? "text-red-600 dark:text-red-400"
                  : "text-yellow-600 dark:text-yellow-400"
            }`}
          >
            {record.wins}-{record.losses}
          </span>
          <span className="text-muted-foreground">
            ({record.avg_rounds_won.toFixed(1)}-
            {record.avg_rounds_lost.toFixed(1)})
          </span>
          <span className="text-muted-foreground/60">
            [{record.league_name}]
          </span>
        </div>
      ))}
    </div>
  );
}
