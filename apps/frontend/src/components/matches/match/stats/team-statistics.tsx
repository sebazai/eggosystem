import type { GameTeamStats, MatchTeamStats } from "@eggosystem/types";
import { TeamStatBox } from "./team-stat-box";
import { useGameTeamRoundBreakdowns } from "@/hooks/data/useGameTeamRoundBreakdowns";
import { cn } from "@/lib/utils";

export interface TeamStatsFilters {
  seasons: string;
  leagues: string;
}

interface TeamStatisticsProps {
  teamStats: (MatchTeamStats | GameTeamStats)[];
  teamStatsFilters: TeamStatsFilters;
  potgClipUrl?: string;
  gameId?: number;
}

export const TeamStatistics = ({
  teamStats,
  teamStatsFilters,
  potgClipUrl,
  gameId
}: TeamStatisticsProps) => {
  const [teamOneStats, teamTwoStats] = teamStats;
  const teamOneId = teamOneStats?.team_id;
  const teamTwoId = teamTwoStats?.team_id;
  const { teamsRoundBreakdown } = useGameTeamRoundBreakdowns(gameId);
  return (
    <div
      className={cn(
        "grid xl:flex grid-cols-1 md:grid-cols-2 xl:flex-row gap-4 w-full",
        potgClipUrl ? "gap-4" : "gap-4 md:gap-10"
      )}
    >
      {/* Video */}
      {potgClipUrl && (
        <div
          className={cn(
            "min-w-0 flex flex-col",
            "order-1 xl:order-2 col-span-1 md:col-span-2 xl:col-auto w-full xl:flex-[3] xl:basis-3/5",
            "md:border-l md:border-r md:border-kanaliiga-orange"
          )}
        >
          <iframe
            allow="clipboard-write"
            allowFullScreen
            src={potgClipUrl}
            className="w-full h-full min-h-[200px] xs:min-h-[300px] sm:min-h-[350px] md:min-h-[400px] lg:min-h-[450px]"
          ></iframe>
        </div>
      )}

      {/* Team 1 Stats */}
      <div
        className={cn(
          "min-w-0 flex flex-col",
          potgClipUrl
            ? "order-2 xl:order-1 col-span-1 w-full xl:w-auto basis-1/5"
            : "flex-1"
        )}
      >
        {teamOneStats && (
          <TeamStatBox
            team={teamOneStats}
            teamStatsFilters={teamStatsFilters}
            roundBreakDown={teamsRoundBreakdown?.find(
              (val) => val.team_id === teamOneId
            )}
          />
        )}
      </div>

      {/* Team 2 Stats */}
      <div
        className={cn(
          "min-w-0 flex flex-col",
          potgClipUrl
            ? "order-2 xl:order-3 col-span-1 w-full xl:w-auto basis-1/5"
            : "flex-1"
        )}
      >
        {teamTwoStats && (
          <TeamStatBox
            team={teamTwoStats}
            teamStatsFilters={teamStatsFilters}
            roundBreakDown={teamsRoundBreakdown?.find(
              (val) => val.team_id === teamTwoId
            )}
          />
        )}
      </div>
    </div>
  );
};
