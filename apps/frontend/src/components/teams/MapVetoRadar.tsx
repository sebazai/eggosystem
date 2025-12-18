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
import type { TeamMapVetoStats } from "@eggosystem/types";

interface MapVetoRadarProps {
  vetoStats: TeamMapVetoStats[];
}

interface ChartDataPoint {
  map: string;
  mapName: string;
  picks: number;
  bans: number;
  picksNormalized: number;
  bansNormalized: number;
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
      <div className="bg-card/95 backdrop-blur-md p-3 rounded-lg border border-muted shadow-lg">
        <h3 className="font-semibold text-sm mb-2">{data.mapName}</h3>
        <div className="flex gap-4 text-xs">
          <p className="text-blue-400 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1" />
            Picks: {data.picks}
          </p>
          <p className="text-orange-400 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1" />
            Bans: {data.bans}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export const MapVetoRadar: React.FC<MapVetoRadarProps> = ({ vetoStats }) => {
  // Safety check
  const validStats = useMemo(() => {
    return Array.isArray(vetoStats) && vetoStats.length > 0 ? vetoStats : [];
  }, [vetoStats]);

  // Calculate max value for normalization
  const maxValue = useMemo(() => {
    if (validStats.length === 0) return 1;
    return Math.max(
      ...validStats.map((s) => Math.max(s.picks || 0, s.bans || 0)),
      1
    );
  }, [validStats]);

  // Prepare data for radar chart - with safety checks
  const chartData = useMemo(() => {
    return validStats.map((stat) => ({
      map: stat.map_name,
      mapName: mapToReadableName(stat.map_name),
      picks: stat.picks || 0,
      bans: stat.bans || 0,
      picksNormalized: (stat.picks || 0) / maxValue,
      bansNormalized: (stat.bans || 0) / maxValue
    }));
  }, [validStats, maxValue]);

  // If there's no data, show alternative content
  if (chartData.length === 0) {
    return (
      <div className="bg-card rounded-lg p-4 shadow-sm">
        <div className="h-[350px] w-full flex items-center justify-center">
          <p className="text-muted-foreground">No map veto data available</p>
        </div>
      </div>
    );
  }

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

            {/* Picks - Blue solid */}
            <Radar
              name="Picks"
              dataKey="picksNormalized"
              stroke="rgba(59, 130, 246, 0.9)"
              fill="rgba(59, 130, 246, 0.3)"
              fillOpacity={0.5}
              strokeWidth={2}
              dot={true}
              activeDot={{ strokeWidth: 2, r: 6 }}
            />

            {/* Bans - Orange dashed */}
            <Radar
              name="Bans"
              dataKey="bansNormalized"
              stroke="rgba(249, 115, 22, 0.9)"
              fill="rgba(249, 115, 22, 0.25)"
              fillOpacity={0.4}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={true}
              activeDot={{ strokeWidth: 2, r: 6 }}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: "10px" }}
              formatter={(value, entry) => (
                <span
                  className="text-sm font-medium"
                  style={{ color: entry.color }}
                >
                  {value}
                </span>
              )}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
