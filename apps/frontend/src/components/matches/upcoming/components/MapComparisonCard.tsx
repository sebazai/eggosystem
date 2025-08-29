import React from "react";
import { mapToReadableName } from "@/lib/utils";
import type { TeamMapStats } from "@eggosystem/types";

interface MapComparisonCardProps {
  team1Stat: TeamMapStats;
  team2Stat: TeamMapStats;
  team1Name: string;
  team2Name: string;
}

export const MapComparisonCard: React.FC<MapComparisonCardProps> = ({
  team1Stat,
  team2Stat,
  team1Name,
  team2Name
}) => {
  return (
    <div className="bg-card rounded-lg p-4 border border-gray-800 hover:border-kanaliiga-orange/50 transition-colors">
      <div className="text-center mb-3">
        <span className="font-medium text-sm text-kanaliiga-orange uppercase">
          {mapToReadableName(team1Stat.map_name)}
        </span>
      </div>

      {/* Team 1 Stats */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-white">{team1Name}</span>
          <div className="flex items-center">
            <span className="text-green-500 text-xs font-medium">
              {team1Stat.wins}
            </span>
            <span className="text-xs mx-1 text-gray-400">/</span>
            <span className="text-red-500 text-xs font-medium">
              {team1Stat.losses}
            </span>
            <span className="text-gray-400 text-xs ml-1">
              ({team1Stat.maps_played})
            </span>
          </div>
        </div>
        <div className="h-3 bg-gray-800 rounded-full relative overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-300/50"
            style={{
              width: `${Math.min(team1Stat.win_percentage, 100)}%`
            }}
          ></div>
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <span className="text-[10px] font-bold text-white drop-shadow-md">
              {team1Stat.win_percentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Team 2 Stats */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-white">{team2Name}</span>
          <div className="flex items-center">
            <span className="text-green-500 text-xs font-medium">
              {team2Stat.wins}
            </span>
            <span className="text-xs mx-1 text-gray-400">/</span>
            <span className="text-red-500 text-xs font-medium">
              {team2Stat.losses}
            </span>
            <span className="text-gray-400 text-xs ml-1">
              ({team2Stat.maps_played})
            </span>
          </div>
        </div>
        <div className="h-3 bg-gray-800 rounded-full relative overflow-hidden">
          <div
            className="h-full rounded-full bg-sky-400/50"
            style={{
              width: `${Math.min(team2Stat.win_percentage, 100)}%`
            }}
          ></div>
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <span className="text-[10px] font-bold text-white drop-shadow-md">
              {team2Stat.win_percentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
