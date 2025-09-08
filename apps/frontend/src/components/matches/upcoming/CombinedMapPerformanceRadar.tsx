"use client";

import React, { useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";
import type { TooltipProps } from "recharts";
import { mapToReadableName } from "@/lib/utils";
import type { TeamMapStats } from "@eggosystem/types";

interface CombinedMapPerformanceRadarProps {
  team1MapStats: TeamMapStats[];
  team2MapStats: TeamMapStats[];
  team1Name: string;
  team2Name: string;
}

interface ChartDataPoint {
  map: string;
  mapName: string;
  team1Value: number;
  team2Value: number;
  team1WinRate: number;
  team2WinRate: number;
  team1Wins: number;
  team1MapsPlayed: number;
  team2Wins: number;
  team2MapsPlayed: number;
}

const CustomTooltip = ({
  active,
  payload
}: TooltipProps<number, string> & {
  payload?: { payload: ChartDataPoint }[];
}) => {
  if (active && payload && payload.length && payload[0]?.payload) {
    const data = payload[0].payload;
    return (
      <div className="bg-card/90 backdrop-blur-sm p-2 rounded-md border border-muted shadow-md">
        <h3 className="font-medium text-sm">{data.mapName}</h3>
        <div className="pt-1 border-t border-gray-700 mt-1">
          <p className="text-xs">
            <span className="inline-block w-3 h-3 bg-kanaliiga-orange/80 mr-1"></span>
            Wins: {data.team1Wins} / {data.team1MapsPlayed}
            <span className="ml-2 font-medium">
              {data.team1WinRate.toFixed(1)}%
            </span>
          </p>
          <p className="text-xs">
            <span className="inline-block w-3 h-3 bg-blue-500/80 mr-1"></span>
            Wins: {data.team2Wins} / {data.team2MapsPlayed}
            <span className="ml-2 font-medium">
              {data.team2WinRate.toFixed(1)}%
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export const CombinedMapPerformanceRadar: React.FC<
  CombinedMapPerformanceRadarProps
> = ({ team1MapStats, team2MapStats, team1Name, team2Name }) => {
  // Safety check
  const validTeam1MapStats = useMemo(() => {
    return Array.isArray(team1MapStats) && team1MapStats.length > 0
      ? team1MapStats
      : [];
  }, [team1MapStats]);

  const validTeam2MapStats = useMemo(() => {
    return Array.isArray(team2MapStats) && team2MapStats.length > 0
      ? team2MapStats
      : [];
  }, [team2MapStats]);

  // Create a map of all map names from both teams (normalize to avoid duplicates)
  const allMapNames = useMemo(() => {
    const mapNames = new Set<string>();
    validTeam1MapStats.forEach((stat) =>
      mapNames.add(mapToReadableName(stat.map_name))
    );
    validTeam2MapStats.forEach((stat) =>
      mapNames.add(mapToReadableName(stat.map_name))
    );
    return Array.from(mapNames);
  }, [validTeam1MapStats, validTeam2MapStats]);

  // Prepare data for radar chart combining both teams
  const chartData = useMemo(() => {
    return allMapNames.map((normalizedMapName) => {
      // Find stats by comparing normalized map names
      const team1Stats = validTeam1MapStats.filter(
        (stat) => mapToReadableName(stat.map_name) === normalizedMapName
      );
      const team2Stats = validTeam2MapStats.filter(
        (stat) => mapToReadableName(stat.map_name) === normalizedMapName
      );

      // Combine stats for maps with the same normalized name
      const team1Stat = team1Stats.reduce(
        (acc, stat) => ({
          map_name: normalizedMapName,
          maps_played: acc.maps_played + (stat.maps_played || 0),
          wins: acc.wins + (stat.wins || 0),
          losses: acc.losses + (stat.losses || 0),
          win_percentage: 0 // Will calculate below
        }),
        {
          map_name: normalizedMapName,
          maps_played: 0,
          wins: 0,
          losses: 0,
          win_percentage: 0
        }
      );

      const team2Stat = team2Stats.reduce(
        (acc, stat) => ({
          map_name: normalizedMapName,
          maps_played: acc.maps_played + (stat.maps_played || 0),
          wins: acc.wins + (stat.wins || 0),
          losses: acc.losses + (stat.losses || 0),
          win_percentage: 0 // Will calculate below
        }),
        {
          map_name: normalizedMapName,
          maps_played: 0,
          wins: 0,
          losses: 0,
          win_percentage: 0
        }
      );

      // Calculate win percentages
      team1Stat.win_percentage =
        team1Stat.maps_played > 0
          ? (team1Stat.wins / team1Stat.maps_played) * 100
          : 0;
      team2Stat.win_percentage =
        team2Stat.maps_played > 0
          ? (team2Stat.wins / team2Stat.maps_played) * 100
          : 0;

      return {
        map: normalizedMapName,
        mapName: normalizedMapName,
        team1Value:
          team1Stat.maps_played > 0
            ? team1Stat.wins / team1Stat.maps_played
            : 0,
        team2Value:
          team2Stat.maps_played > 0
            ? team2Stat.wins / team2Stat.maps_played
            : 0,
        team1WinRate: team1Stat.win_percentage || 0,
        team2WinRate: team2Stat.win_percentage || 0,
        team1Wins: team1Stat.wins || 0,
        team1MapsPlayed: team1Stat.maps_played || 0,
        team2Wins: team2Stat.wins || 0,
        team2MapsPlayed: team2Stat.maps_played || 0
      };
    });
  }, [allMapNames, validTeam1MapStats, validTeam2MapStats]);

  // If there's no data, show alternative content
  if (chartData.length === 0) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center">
        <p>No map performance data available</p>
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="#444" strokeWidth={0.5} />
          <PolarAngleAxis
            dataKey="mapName"
            tick={{ fill: "#888", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 1]}
            tick={false}
            stroke="transparent"
          />
          <Radar
            name={team1Name}
            dataKey="team1Value"
            stroke="rgba(234, 88, 12, 0.8)" // kanaliiga-orange
            fill="rgba(234, 88, 12, 0.4)" // kanaliiga-orange with transparency
            fillOpacity={0.6}
            dot={true}
            activeDot={{ strokeWidth: 2, r: 6 }}
          />
          <Radar
            name={team2Name}
            dataKey="team2Value"
            stroke="rgba(59, 130, 246, 0.8)" // blue-500
            fill="rgba(59, 130, 246, 0.4)" // blue-500 with transparency
            fillOpacity={0.6}
            dot={true}
            activeDot={{ strokeWidth: 2, r: 6 }}
          />
          <Legend />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
