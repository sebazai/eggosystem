import React from "react";
import { mapToReadableName } from "@/lib/utils";
import type { TeamMapStats } from "@eggosystem/types";

interface MapComparisonCardProps {
  team1Stat: TeamMapStats;
  team2Stat: TeamMapStats;
  team1Name: string;
  team2Name: string;
}

const MapComparisonTeamStats = ({
  teamStat,
  teamName
}: {
  teamStat: TeamMapStats;
  teamName: string;
}) => {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold">{teamName}</span>
        <div className="flex items-center">
          <span className="text-green-500 text-xs font-medium">
            {teamStat.wins}
          </span>
          <span className="text-xs mx-1 text-gray-400">/</span>
          <span className="text-red-500 text-xs font-medium">
            {teamStat.losses}
          </span>
          <span className="text-xs ml-1">({teamStat.maps_played})</span>
        </div>
      </div>
      <div className="h-3 dark:bg-gray-800 bg-gray-400 rounded-full relative overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-300/50"
          style={{
            width: `${Math.min(teamStat.win_percentage, 100)}%`
          }}
        ></div>
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <span className="text-[10px] font-bold drop-shadow-md">
            {teamStat.win_percentage.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export const MapComparisonCard: React.FC<MapComparisonCardProps> = ({
  team1Stat,
  team2Stat,
  team1Name,
  team2Name
}) => {
  return (
    <div className="bg-card rounded-lg p-4 border">
      <div className="text-center mb-3">
        <span className="font-medium text-sm text-kanaliiga-orange uppercase">
          {mapToReadableName(team1Stat.map_name)}
        </span>
      </div>

      <MapComparisonTeamStats teamStat={team1Stat} teamName={team1Name} />
      <MapComparisonTeamStats teamStat={team2Stat} teamName={team2Name} />
    </div>
  );
};
