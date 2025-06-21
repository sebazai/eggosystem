"use client";

import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import type { TooltipProps } from "recharts";
import { mapToReadableName } from "@/lib/utils";
import type { TeamMapStats } from "@eggosystem/types";

interface MapPerformanceRadarProps {
  mapStats: TeamMapStats[];
}

interface ChartDataPoint {
  map: string;
  mapName: string;
  winRate: number;
  wins: number;
  maps_played: number;
  value: number;
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
        <h3 className="font-medium text-sm">{mapToReadableName(data.map)}</h3>
        <p className="text-xs text-muted-foreground">
          Wins: {data.wins} / {data.maps_played}
        </p>
        <p className="text-xs font-medium text-kanaliiga-orange">
          Win rate: {data.winRate.toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

export const MapPerformanceRadar: React.FC<MapPerformanceRadarProps> = ({
  mapStats
}) => {
  // Prepare data for radar chart
  const chartData = mapStats.map((stat) => ({
    map: stat.map_name,
    mapName: mapToReadableName(stat.map_name),
    winRate: stat.win_percentage,
    wins: stat.wins,
    maps_played: stat.maps_played,
    value: stat.wins / stat.maps_played // Normalized value between 0-1
  }));

  return (
    <div className="bg-card rounded-lg p-4 shadow-sm">
      <h2 className="font-medium text-lg mb-4">Map Performance Overview</h2>
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
              name="Win Rate"
              dataKey="value"
              stroke="rgba(234, 88, 12, 0.8)" // kanaliiga-orange
              fill="rgba(234, 88, 12, 0.4)" // kanaliiga-orange with transparency
              fillOpacity={0.6}
              dot={true}
              activeDot={{ strokeWidth: 2, r: 6 }}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
