import type { GameTeamStats, MatchTeamStats } from "@eggosystem/types";
import { TeamStatBox } from "./team-stat-box";
import { useGameTeamRoundBreakdowns } from "@/hooks/data/useGameTeamRoundBreakdowns";

export interface TeamStatsFilters {
  seasons: string;
  leagues: string;
}

interface TeamStatisticsProps {
  teamStats: (MatchTeamStats | GameTeamStats)[];
  teamStatsFilters: TeamStatsFilters;
  gameId?: number;
}

export const TeamStatistics = ({
  teamStats,
  teamStatsFilters,
  gameId
}: TeamStatisticsProps) => {
  const [teamOneStats, teamTwoStats] = teamStats;
  const teamOneId = teamOneStats?.team_id;
  const teamTwoId = teamTwoStats?.team_id;
  const { teamsRoundBreakdown } = useGameTeamRoundBreakdowns(gameId);
  return (
    <div className="mb-4 bg-card">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-10">
        {/* Team 1 Stats */}
        {teamOneStats && (
          <TeamStatBox
            team={teamOneStats}
            teamStatsFilters={teamStatsFilters}
            roundBreakDown={teamsRoundBreakdown?.find(
              (val) => val.team_id === teamOneId
            )}
          />
        )}

        {/*         <div className="p-4 flex flex-col justify-center items-center md:border-l md:border-r md:border-kanaliiga-orange">
          <span className="text-muted-foreground mb-2">GOTV Demo File</span>
          <button className="px-4 py-2 bg-kanaliiga-orange rounded text-sm hover:bg-kanaliiga-light-brown transition-colors">
            Download
          </button>
        </div> */}

        {/* Team 2 Stats */}
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
