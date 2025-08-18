"use client";

import React from "react";
import type {
  MatchInfo,
  TeamMapStats as TeamMapStatsType
} from "@eggosystem/types";
import { mapToReadableName, type FilterParamsQuery } from "@/lib/utils";
import { CombinedMapPerformanceRadar } from "./CombinedMapPerformanceRadar";

interface TeamMapBreakdownProps {
  matchInfo: MatchInfo;
  baseFilters: FilterParamsQuery;
}

export const TeamMapBreakdown = ({ matchInfo }: TeamMapBreakdownProps) => {
  // Mock data for demonstration with string values for stats to match the expected types
  const team1MapStats: TeamMapStatsType[] = [
    {
      map_id: 1,
      map_name: "ancient",
      maps_played: 7,
      wins: 4,
      losses: 3,
      win_percentage: 57.1,
      avg_score: "12.4",
      avg_opponent_score: "9.7",
      ct_win_percentage: 55,
      t_win_percentage: 58,
      ct_kd: "1.1",
      t_kd: "1.2",
      kast: 72,
      ct_kast: 70,
      t_kast: 75,
      kills_ct: 150,
      deaths_ct: 130,
      kills_t: 145,
      deaths_t: 120
    },
    {
      map_id: 2,
      map_name: "anubis",
      maps_played: 6,
      wins: 5,
      losses: 1,
      win_percentage: 83.3,
      avg_score: "13.2",
      avg_opponent_score: "6.8",
      ct_win_percentage: 80,
      t_win_percentage: 85,
      ct_kd: "1.5",
      t_kd: "1.4",
      kast: 80,
      ct_kast: 82,
      t_kast: 78,
      kills_ct: 180,
      deaths_ct: 120,
      kills_t: 175,
      deaths_t: 125
    },
    {
      map_id: 3,
      map_name: "inferno",
      maps_played: 5,
      wins: 2,
      losses: 3,
      win_percentage: 40.0,
      avg_score: "10.4",
      avg_opponent_score: "12.6",
      ct_win_percentage: 42,
      t_win_percentage: 38,
      ct_kd: "0.9",
      t_kd: "0.85",
      kast: 68,
      ct_kast: 70,
      t_kast: 65,
      kills_ct: 120,
      deaths_ct: 135,
      kills_t: 115,
      deaths_t: 140
    },
    {
      map_id: 4,
      map_name: "mirage",
      maps_played: 8,
      wins: 6,
      losses: 2,
      win_percentage: 75.0,
      avg_score: "13.5",
      avg_opponent_score: "8.2",
      ct_win_percentage: 78,
      t_win_percentage: 72,
      ct_kd: "1.3",
      t_kd: "1.2",
      kast: 75,
      ct_kast: 77,
      t_kast: 74,
      kills_ct: 165,
      deaths_ct: 125,
      kills_t: 160,
      deaths_t: 130
    },
    {
      map_id: 5,
      map_name: "nuke",
      maps_played: 3,
      wins: 2,
      losses: 1,
      win_percentage: 66.7,
      avg_score: "12.0",
      avg_opponent_score: "10.3",
      ct_win_percentage: 70,
      t_win_percentage: 60,
      ct_kd: "1.2",
      t_kd: "1.0",
      kast: 73,
      ct_kast: 75,
      t_kast: 70,
      kills_ct: 130,
      deaths_ct: 110,
      kills_t: 125,
      deaths_t: 125
    },
    {
      map_id: 6,
      map_name: "dust2",
      maps_played: 10,
      wins: 7,
      losses: 3,
      win_percentage: 70.0,
      avg_score: "13.8",
      avg_opponent_score: "9.1",
      ct_win_percentage: 68,
      t_win_percentage: 72,
      ct_kd: "1.2",
      t_kd: "1.3",
      kast: 76,
      ct_kast: 74,
      t_kast: 78,
      kills_ct: 170,
      deaths_ct: 140,
      kills_t: 175,
      deaths_t: 135
    }
  ];

  const team2MapStats: TeamMapStatsType[] = [
    {
      map_id: 1,
      map_name: "ancient",
      maps_played: 7,
      wins: 3,
      losses: 4,
      win_percentage: 42.9,
      avg_score: "11.0",
      avg_opponent_score: "12.7",
      ct_win_percentage: 45,
      t_win_percentage: 40,
      ct_kd: "0.9",
      t_kd: "0.8",
      kast: 68,
      ct_kast: 70,
      t_kast: 65,
      kills_ct: 130,
      deaths_ct: 145,
      kills_t: 120,
      deaths_t: 150
    },
    {
      map_id: 2,
      map_name: "anubis",
      maps_played: 4,
      wins: 3,
      losses: 1,
      win_percentage: 75.0,
      avg_score: "13.0",
      avg_opponent_score: "8.5",
      ct_win_percentage: 78,
      t_win_percentage: 72,
      ct_kd: "1.2",
      t_kd: "1.1",
      kast: 75,
      ct_kast: 77,
      t_kast: 73,
      kills_ct: 150,
      deaths_ct: 125,
      kills_t: 145,
      deaths_t: 130
    },
    {
      map_id: 3,
      map_name: "inferno",
      maps_played: 5,
      wins: 3,
      losses: 2,
      win_percentage: 60.0,
      avg_score: "12.2",
      avg_opponent_score: "10.8",
      ct_win_percentage: 62,
      t_win_percentage: 58,
      ct_kd: "1.1",
      t_kd: "1.0",
      kast: 70,
      ct_kast: 72,
      t_kast: 68,
      kills_ct: 135,
      deaths_ct: 125,
      kills_t: 130,
      deaths_t: 130
    },
    {
      map_id: 4,
      map_name: "mirage",
      maps_played: 7,
      wins: 6,
      losses: 1,
      win_percentage: 85.7,
      avg_score: "14.0",
      avg_opponent_score: "7.6",
      ct_win_percentage: 88,
      t_win_percentage: 82,
      ct_kd: "1.5",
      t_kd: "1.4",
      kast: 82,
      ct_kast: 85,
      t_kast: 80,
      kills_ct: 175,
      deaths_ct: 115,
      kills_t: 170,
      deaths_t: 120
    },
    {
      map_id: 5,
      map_name: "nuke",
      maps_played: 2,
      wins: 2,
      losses: 0,
      win_percentage: 100.0,
      avg_score: "13.5",
      avg_opponent_score: "6.5",
      ct_win_percentage: 100,
      t_win_percentage: 100,
      ct_kd: "1.8",
      t_kd: "1.7",
      kast: 85,
      ct_kast: 88,
      t_kast: 82,
      kills_ct: 140,
      deaths_ct: 80,
      kills_t: 135,
      deaths_t: 80
    },
    {
      map_id: 6,
      map_name: "dust2",
      maps_played: 8,
      wins: 4,
      losses: 4,
      win_percentage: 50.0,
      avg_score: "11.5",
      avg_opponent_score: "11.5",
      ct_win_percentage: 52,
      t_win_percentage: 48,
      ct_kd: "1.0",
      t_kd: "0.95",
      kast: 70,
      ct_kast: 72,
      t_kast: 68,
      kills_ct: 140,
      deaths_ct: 140,
      kills_t: 135,
      deaths_t: 140
    }
  ];

  // Get team names safely
  const team1Name = matchInfo.teams?.[0]?.name || "Team 1";
  const team2Name = matchInfo.teams?.[1]?.name || "Team 2";

  // Render actual map stats
  return (
    <div className="bg-card rounded-md overflow-hidden mb-3">
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4 text-kanaliiga-orange">
          MAP PERFORMANCE
        </h2>

        {/* Map Performance Radar Chart */}
        <div className="mb-6 bg-gray-900/50 rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-medium mb-4 text-center text-kanaliiga-orange uppercase">
            Map Win Rate Comparison
          </h3>
          <div className="max-w-3xl mx-auto">
            <CombinedMapPerformanceRadar
              team1MapStats={team1MapStats}
              team2MapStats={team2MapStats}
              team1Name={team1Name}
              team2Name={team2Name}
            />
          </div>
        </div>

        {/* Map Statistics - Visual Comparison */}
        <div className="grid grid-cols-1 gap-2">
          {/* Map comparison rows */}
          {team1MapStats.map((team1Stat, index) => {
            const team2Stat =
              team2MapStats.find(
                (stat) => stat.map_name === team1Stat.map_name
              ) || team2MapStats[index];
            return (
              <div
                key={team1Stat.map_id}
                className="bg-gray-900/50 rounded-md p-3"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm text-kanaliiga-orange uppercase">
                    {mapToReadableName(team1Stat.map_name)}
                  </span>
                </div>

                {/* Team 1 Stats */}
                <div className="flex items-center mb-3">
                  <div className="w-20 text-left mr-2">
                    <span className="text-xs font-semibold text-white">
                      {team1Name}
                    </span>
                    <div className="flex items-center mt-1">
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

                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="h-5 bg-gray-800 rounded-full flex-1 relative overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            team1Stat.win_percentage > 70
                              ? "bg-green-500"
                              : team1Stat.win_percentage > 50
                                ? "bg-green-600"
                                : team1Stat.win_percentage > 40
                                  ? "bg-yellow-600"
                                  : "bg-red-600"
                          }`}
                          style={{
                            width: `${Math.min(team1Stat.win_percentage, 100)}%`
                          }}
                        ></div>
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white drop-shadow-md">
                            {team1Stat.win_percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team 2 Stats */}
                <div className="flex items-center">
                  <div className="w-20 text-left mr-2">
                    <span className="text-xs font-semibold text-white">
                      {team2Name}
                    </span>
                    <div className="flex items-center mt-1">
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

                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="h-5 bg-gray-800 rounded-full flex-1 relative overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            team2Stat.win_percentage > 70
                              ? "bg-blue-500"
                              : team2Stat.win_percentage > 50
                                ? "bg-blue-600"
                                : team2Stat.win_percentage > 40
                                  ? "bg-yellow-600"
                                  : "bg-red-600"
                          }`}
                          style={{
                            width: `${Math.min(team2Stat.win_percentage, 100)}%`
                          }}
                        ></div>
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white drop-shadow-md">
                            {team2Stat.win_percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
