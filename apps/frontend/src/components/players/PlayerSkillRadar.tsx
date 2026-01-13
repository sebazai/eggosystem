"use client";

import React, { useState } from "react";
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
import type { PlayerSkillDiagram } from "@eggosystem/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";

interface PlayerTeamDetails {
  team_id: number;
  team_name: string;
}

interface PlayerSkillRadarProps {
  playerSkillData: PlayerSkillDiagram;
  compareSkillData?: PlayerSkillDiagram;
  isLoading: boolean;
  onCompareOptionChange: (compareOption: string) => void;
  initialCompareOption?: string;
  isCompareDataNotFound?: boolean;
  playerTeam?: PlayerTeamDetails | null;
}

// Define all possible comparison option types for type safety
type _CompareOption =
  | "none"
  | "aggregate"
  | "team"
  | `faceit_${number}`
  | `cs2rank_${number}`;

interface CompareOptionGroup {
  label: string;
  options: { value: string; label: string }[];
}

// Generate CS2 rank options from 0 to 30000 in increments of 1000
const generateCS2RankOptions = () => {
  return Array.from({ length: 31 }, (_, i) => {
    const rankValue = i * 1000;
    return {
      value: `cs2rank_${rankValue}`,
      label: `${rankValue}`
    };
  });
};

// Generate comparison options for the dropdown
const getCompareOptionGroups = (hasTeam: boolean): CompareOptionGroup[] => {
  const generalOptions = [
    { value: "none", label: "No comparison" },
    { value: "aggregate", label: "All players" }
  ];

  if (hasTeam) {
    generalOptions.push({ value: "team", label: "Player's team" });
  }

  return [
    {
      label: "General",
      options: generalOptions
    },
    {
      label: "Faceit Levels",
      options: Array.from({ length: 10 }, (_, i) => ({
        value: `faceit_${i + 1}`,
        label: `Faceit Level ${i + 1}`
      }))
    },
    {
      label: "CS2 Ranks",
      options: generateCS2RankOptions()
    }
  ];
};

interface ChartDataPoint {
  category: string;
  player: number;
  compare?: number;
  fullMark: number;
}

const CustomTooltip = ({
  active,
  payload
}: TooltipProps<number, string> & {
  payload?: {
    payload: ChartDataPoint;
    dataKey: string;
    name: string;
    color: string;
  }[];
}) => {
  if (active && payload && payload.length && payload[0]) {
    return (
      <div className="bg-card/90 backdrop-blur-sm p-2 rounded-md border border-muted shadow-md">
        <h3 className="font-medium text-sm">{payload[0].payload.category}</h3>
        {payload.map((entry) => (
          <p
            key={entry.dataKey}
            className="text-xs"
            style={{ color: entry.color }}
          >
            {entry.name}: {entry.value}/100
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const PlayerSkillRadar: React.FC<PlayerSkillRadarProps> = ({
  playerSkillData,
  compareSkillData,
  isLoading,
  onCompareOptionChange,
  initialCompareOption = "none",
  isCompareDataNotFound = false,
  playerTeam
}) => {
  // Use initialCompareOption as the source of truth
  // For controlled component behavior, parent manages the state
  // Local state is only for user-initiated changes that haven't been synced yet
  const [localCompareOption, setLocalCompareOption] = useState<string | null>(
    null
  );

  // Use prop value if provided, otherwise use local state
  const compareOption =
    initialCompareOption !== undefined
      ? initialCompareOption
      : (localCompareOption ?? "");

  const setCompareOption = (value: string) => {
    // If parent is controlling, don't update local state
    // Otherwise, update local state
    if (initialCompareOption === undefined) {
      setLocalCompareOption(value);
    }
    // Always notify parent of change
    onCompareOptionChange(value);
  };

  const handleCompareChange = (value: string) => {
    setCompareOption(value);
    onCompareOptionChange(value);
  };

  // Get comparison options based on whether player has a team
  const compareOptionGroups = getCompareOptionGroups(!!playerTeam?.team_id);

  // Flat map of all options for easy lookup
  const allCompareOptions = compareOptionGroups.flatMap(
    (group) => group.options
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Skill Diagram</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full flex items-center justify-center">
            <Skeleton className="h-[300px] w-[300px] rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for radar chart
  const chartData: ChartDataPoint[] = [
    {
      category: "Aim",
      player: playerSkillData.aim,
      ...(compareSkillData && { compare: compareSkillData.aim }),
      fullMark: 100
    },
    {
      category: "Impact",
      player: playerSkillData.impact,
      ...(compareSkillData && { compare: compareSkillData.impact }),
      fullMark: 100
    },
    {
      category: "Positioning",
      player: playerSkillData.positioning,
      ...(compareSkillData && { compare: compareSkillData.positioning }),
      fullMark: 100
    },
    {
      category: "Utility",
      player: playerSkillData.utility,
      ...(compareSkillData && { compare: compareSkillData.utility }),
      fullMark: 100
    },
    {
      category: "Consistency",
      player: playerSkillData.consistency,
      ...(compareSkillData && { compare: compareSkillData.consistency }),
      fullMark: 100
    }
  ];

  // Find the current option label
  const currentOptionLabel =
    allCompareOptions.find((opt) => opt.value === compareOption)?.label ||
    "Compare with...";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Skill Diagram</CardTitle>
          <div className="w-64">
            <Select value={compareOption} onValueChange={handleCompareChange}>
              <SelectTrigger>
                <SelectValue placeholder="Compare with...">
                  {currentOptionLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {compareOptionGroups.map((group) => (
                  <React.Fragment key={group.label}>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      {group.label}
                    </div>
                    {group.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                    <div className="h-px bg-muted my-1" />
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isCompareDataNotFound && compareOption !== "none" && (
          <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No comparison data available for the selected option and filters.
            </AlertDescription>
          </Alert>
        )}
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid stroke="#444" strokeWidth={0.5} />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: "#888", fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: "#888", fontSize: 10 }}
                tickCount={5}
                axisLine={false}
                tickLine={false}
              />
              <Radar
                name={playerSkillData.nickname}
                dataKey="player"
                stroke="rgba(234, 88, 12, 0.8)" // kanaliiga-orange
                fill="rgba(234, 88, 12, 0.4)" // kanaliiga-orange with transparency
                fillOpacity={0.6}
                dot={true}
                activeDot={{ strokeWidth: 2, r: 6 }}
              />
              {compareSkillData && (
                <Radar
                  name={compareSkillData.nickname}
                  dataKey="compare"
                  stroke="rgba(59, 130, 246, 0.8)" // blue
                  fill="rgba(59, 130, 246, 0.4)" // blue with transparency
                  fillOpacity={0.6}
                  dot={true}
                  activeDot={{ strokeWidth: 2, r: 6 }}
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="horizontal"
                align="center"
                verticalAlign="bottom"
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
