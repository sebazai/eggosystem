import type { MatchTeamStats } from "@eggosystem/types";
import { TeamStatBox } from "./team-stat-box";

interface TeamStatisticsProps {
  teamStats: MatchTeamStats[];
}

export const TeamStatistics = ({ teamStats }: TeamStatisticsProps) => {
  const [team1, team2] = teamStats;
  return (
    <div className="mb-4 bg-card">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px]">
        {/* Team 1 Stats */}
        {team1 && <TeamStatBox team={team1} />}

        {/* Center Stats - GOTV Demo */}
        <div className="p-4 flex flex-col justify-center items-center border-l border-r border-gray-800">
          <span className="text-muted-foreground mb-2">GOTV Demo File</span>
          <button className="px-4 py-2 bg-kanaliiga-orange rounded text-sm hover:bg-kanaliiga-light-brown transition-colors">
            Download
          </button>
        </div>

        {/* Team 2 Stats */}
        {team2 && <TeamStatBox team={team2} />}
      </div>
    </div>
  );
};
