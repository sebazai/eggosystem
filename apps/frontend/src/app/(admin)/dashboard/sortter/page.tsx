"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import { XAxis, YAxis, Area, AreaChart, CartesianGrid } from "recharts";
import { useSortter } from "@/hooks/data/useSortter";
import { SeasonSelector } from "@/components/sortter/SeasonSelector";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

// Enhanced line chart component using shadcn Chart
const MiniChart = ({ data }: { data: number[] }) => {
  // Transform data for recharts - no need to sort, use values directly
  const chartData = data.map((value, index) => ({
    index: index + 1,
    kanaelo: value
  }));

  const chartConfig = {
    kanaelo: {
      label: "Kanaelo",
      color: "hsl(var(--primary))"
    }
  } satisfies ChartConfig;

  // Create tick values for gridlines and y-axis - every 50 points
  const yAxisTicks = [0, 50, 100, 150, 200, 250, 300, 350];

  return (
    <div className="w-86 h-24 p-1">
      <ChartContainer config={chartConfig}>
        <AreaChart
          data={chartData}
          margin={{ top: 5, right: 8, left: 8, bottom: 5 }}
        >
          <defs>
            <linearGradient id="fillKanaelo" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-kanaelo)"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="var(--color-kanaelo)"
                stopOpacity={0.05}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--muted-foreground)/0.2)"
          />
          <XAxis
            dataKey="index"
            axisLine={true}
            tickLine={true}
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(value) => value.toString()}
            tickMargin={2}
          />
          <YAxis
            axisLine={true}
            tickLine={true}
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(value) => value.toString()}
            domain={[0, 350]}
            ticks={yAxisTicks}
            tickMargin={2}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(label, payload) =>
                  payload?.[0]?.payload?.index
                    ? `Player ${payload[0].payload.index} Kanaelo`
                    : "Kanaelo"
                }
                formatter={(value) => [value]}
                hideIndicator={true}
              />
            }
          />
          <Area
            dataKey="kanaelo"
            type="monotone"
            fill="url(#fillKanaelo)"
            stroke="var(--color-kanaelo)"
            strokeWidth={2}
            dot={{
              fill: "var(--color-kanaelo)",
              strokeWidth: 1.5,
              r: 3,
              stroke: "hsl(var(--background))"
            }}
            activeDot={{
              r: 5,
              stroke: "var(--color-kanaelo)",
              strokeWidth: 2,
              fill: "var(--color-kanaelo)"
            }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
};

// Color scheme that changes every 12 teams with vibrant middle shades
const getRowColorClass = (index: number) => {
  const colorGroups = [
    // Teams 1-12: Red (vibrant middle shade)
    "bg-red-200 border-red-300 dark:bg-red-800/40 dark:border-red-700/40",
    // Teams 13-24: Purple (vibrant middle shade)
    "bg-purple-200 border-purple-300 dark:bg-purple-800/40 dark:border-purple-700/40",
    // Teams 25-36: Blue (vibrant middle shade)
    "bg-blue-200 border-blue-300 dark:bg-blue-800/40 dark:border-blue-700/40"
  ];

  const groupIndex = Math.floor(index / 12) % colorGroups.length;
  return colorGroups[groupIndex];
};

export default function SortterPage() {
  const {
    teams,
    seasons,
    selectedSeason,
    isLoadingTeams,
    isLoadingSeasons,
    error,
    setSelectedSeason
  } = useSortter();

  const [comments, setComments] = useState<{ [key: number]: string }>({});

  const handleCommentChange = (teamId: number, value: string) => {
    setComments((prev) => ({ ...prev, [teamId]: value }));
  };

  // Calculate average of top4 values
  const calculateAvg = (values: number[]) => {
    if (!values || values.length < 4) return 0;
    const top4 = [...values].slice(0, 4);
    return (top4.reduce((sum, val) => sum + val, 0) / 4).toFixed(3);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sortter</h1>
          <p className="text-muted-foreground">
            Team ranking management and analysis tool
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Season:</span>
          <SeasonSelector
            seasons={seasons}
            selectedSeason={selectedSeason}
            onChange={setSelectedSeason}
            isLoading={isLoadingSeasons}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 border border-red-400 bg-red-100 dark:bg-red-900/20 rounded-lg">
          <h5 className="text-sm font-medium text-red-800 dark:text-red-300">
            Error
          </h5>
          <div className="text-sm text-red-700 dark:text-red-400">
            {error.message}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Team Rankings</CardTitle>
          <CardDescription>
            View and manage team rankings with kanapoints analysis
            {teams.length > 0 && ` (${teams.length} teams)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {isLoadingTeams ? (
            <div className="flex justify-center items-center p-12">
              <Spinner size="lg" />
              <span className="ml-4 text-muted-foreground">
                Loading team data...
              </span>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium text-xs w-16">
                      ID
                    </th>
                    <th className="text-left p-2 font-medium text-xs w-44">
                      Team
                    </th>
                    <th className="text-left p-2 font-medium text-xs w-32">
                      kanaelo (sum 5 / avg4)
                    </th>
                    <th className="text-left p-2 font-medium text-xs w-20">
                      League
                    </th>
                    <th className="text-center p-2 font-medium text-xs w-96">
                      Graph (0-350)
                    </th>
                    <th className="text-left p-2 font-medium text-xs w-96">
                      Comments
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team, index) => {
                    const totalValue = team.top5_values.reduce(
                      (sum, val) => sum + val,
                      0
                    );
                    const avgValue = calculateAvg(team.top5_values);

                    return (
                      <tr
                        key={team.team_id}
                        className={`border-b ${getRowColorClass(index)} transition-colors hover:bg-opacity-80`}
                      >
                        <td className="p-2 font-medium text-xs">
                          {team.team_id}
                        </td>
                        <td className="p-2 font-medium text-xs">
                          {team.team_name}
                        </td>
                        <td className="p-2 text-xs">
                          <div className="font-medium">
                            {totalValue} / {avgValue}
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant="secondary" className="text-xs">
                            {Math.floor(index / 12) + 1}
                          </Badge>
                        </td>
                        <td className="p-1">
                          <MiniChart data={team.top5_values} />
                        </td>
                        <td className="p-2">
                          <Textarea
                            placeholder="Add comments..."
                            value={
                              comments[team.team_id] || team.comments || ""
                            }
                            onChange={(e) =>
                              handleCommentChange(team.team_id, e.target.value)
                            }
                            className="text-xs bg-background/80 w-[360px] h-[192px] resize-none overflow-hidden"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
