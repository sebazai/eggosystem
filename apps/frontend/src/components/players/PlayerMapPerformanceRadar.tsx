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
import type { PlayerMapStats } from "@eggosystem/types";

interface PlayerMapPerformanceRadarProps {
  mapStats: PlayerMapStats[];
}

interface ChartDataPoint {
  map: string;
  mapName: string;
  winRate: number;
  kd: number;
  adr: number;
  value: number; // Normalized performance metric
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
          K/D: {data.kd.toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground">
          ADR: {data.adr.toFixed(1)}
        </p>
        <p className="text-xs font-medium text-kanaliiga-orange">
          Win rate: {data.winRate.toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

export const PlayerMapPerformanceRadar: React.FC<
  PlayerMapPerformanceRadarProps
> = ({ mapStats }) => {
  // Prepare data for radar chart
  const chartData = mapStats.map((stat) => {
    // Calculate a normalized performance value between 0-1
    // Using a weighted average of KD, ADR, and win percentage
    const kdNormalized = Math.min(1, stat.kd / 2); // Normalize KD (1.0 is average)
    const adrNormalized = Math.min(1, stat.adr / 100); // Normalize ADR (100 is good)
    const winRateNormalized = stat.win_percentage / 100;

    // Weighted average (adjust weights as needed)
    const performanceValue =
      kdNormalized * 0.4 + adrNormalized * 0.3 + winRateNormalized * 0.3;

    return {
      map: stat.map_name,
      mapName: mapToReadableName(stat.map_name),
      winRate: stat.win_percentage,
      kd: stat.kd,
      adr: stat.adr,
      value: performanceValue
    };
  });

  return (
    <div className="bg-card rounded-lg p-4 shadow-sm">
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
              name="Performance"
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
