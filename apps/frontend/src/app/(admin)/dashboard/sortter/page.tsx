"use client";

import { useState } from "react";
import { useSortter } from "@/hooks/data/dashboard/useSortter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { SeasonSelector } from "@/components/sortter/SeasonSelector";
import { Textarea } from "@/components/ui/textarea";
import { PlayerValuesFloatingWindow } from "@/components/dashboard/PlayerValuesFloatingWindow";
import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { toast } from "sonner";
import { clientApiFetch } from "@/lib/apiClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import React from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import { XAxis, YAxis, Area, AreaChart, CartesianGrid } from "recharts";

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

// Color scheme with a unique color for each division
const getRowColorClass = (index: number) => {
  const colorGroups = [
    // Division 1: Red
    "bg-red-200 border-red-300 dark:bg-red-800/40 dark:border-red-700/40",
    // Division 2: Purple
    "bg-purple-200 border-purple-300 dark:bg-purple-800/40 dark:border-purple-700/40",
    // Division 3: Blue
    "bg-blue-200 border-blue-300 dark:bg-blue-800/40 dark:border-blue-700/40",
    // Division 4: Green
    "bg-green-200 border-green-300 dark:bg-green-800/40 dark:border-green-700/40",
    // Division 5: Amber
    "bg-amber-200 border-amber-300 dark:bg-amber-800/40 dark:border-amber-700/40",
    // Division 6: Indigo
    "bg-indigo-200 border-indigo-300 dark:bg-indigo-800/40 dark:border-indigo-700/40",
    // Division 7: Teal
    "bg-teal-200 border-teal-300 dark:bg-teal-800/40 dark:border-teal-700/40",
    // Division 8: Rose
    "bg-rose-200 border-rose-300 dark:bg-rose-800/40 dark:border-rose-700/40",
    // Division 9: Lime
    "bg-lime-200 border-lime-300 dark:bg-lime-800/40 dark:border-lime-700/40",
    // Division 10: Cyan
    "bg-cyan-200 border-cyan-300 dark:bg-cyan-800/40 dark:border-cyan-700/40"
  ];

  // Use division index directly instead of modulo
  return colorGroups[index] || colorGroups[0]; // Fallback to first color if index out of bounds
};

// Get division name based on division number
const getDivisionName = (division: number): string => {
  switch (division) {
    case 1:
      return "Masters";
    case 2:
      return "Challengers";
    case 3:
      return "Prospects";
    default:
      return `div${division}`;
  }
};

// Generate division options
const generateDivisionOptions = (count: number) => {
  const options = [];
  for (let i = 1; i <= count; i++) {
    options.push({
      value: i,
      label: getDivisionName(i)
    });
  }
  return options;
};

export default function SortterPage() {
  const {
    teams,
    seasons,
    playerValues,
    selectedSeason,
    selectedTeamId,
    floatingPosition,
    comments,
    divisions,
    isLoadingTeams,
    isLoadingSeasons,
    isLoadingPlayerValues,
    isLoadingPlacements,
    isSaving,
    isFinalizing,
    error,
    setSelectedSeason,
    showTeamPlayerValues,
    closeTeamPlayerValues,
    prefetchPlayerValues,
    handleCommentChange,
    handleDivisionChange,
    savePlacements,
    finalizePlacements,
    isViewMode
  } = useSortter();

  const [isPopulatingQueue, setIsPopulatingQueue] = useState(false);

  // Calculate average of top4 values
  const calculateAvg = (values: number[]) => {
    if (!values || values.length < 4) return 0;
    const top4 = [...values].slice(0, 4);
    return (top4.reduce((sum, val) => sum + val, 0) / 4).toFixed(3);
  };

  // Handle double click on team row
  const handleTeamDoubleClick = (teamId: number, event: React.MouseEvent) => {
    showTeamPlayerValues(teamId, { x: event.clientX, y: event.clientY });
  };

  // Prefetch data on row hover
  const handleTeamHover = (teamId: number) => {
    prefetchPlayerValues(teamId);
  };

  // Find the selected team name
  const selectedTeam = teams.find((team) => team.team_id === selectedTeamId);

  // Calculate max division number based on team count
  const maxDivision = Math.ceil((teams.length || 0) / 12);
  const divisionOptions = generateDivisionOptions(maxDivision);

  // Calculate division summary
  const divisionSummary = React.useMemo(() => {
    if (!teams.length) return [];

    // Create a map to count teams per division
    const divisionCounts = new Map<number, number>();

    // Count teams in each division
    teams.forEach((team, index) => {
      // Default to position-based division if not explicitly set
      const divisionNumber =
        divisions && team.team_id in divisions
          ? Number(divisions[team.team_id])
          : Math.floor(index / 12) + 1;

      // Increment the count for this division
      divisionCounts.set(
        divisionNumber,
        (divisionCounts.get(divisionNumber) || 0) + 1
      );
    });

    // Convert to array format for rendering
    const summary: { division: number; name: string; count: number }[] = [];

    // Add entries for all divisions up to max division
    for (let i = 1; i <= maxDivision; i++) {
      summary.push({
        division: i,
        name: getDivisionName(i),
        count: divisionCounts.get(i) || 0
      });
    }

    return summary;
  }, [teams, divisions, maxDivision]);

  // Handle populating kanaelo queue
  const handlePopulateKanaeloQueue = async () => {
    if (!selectedSeason) {
      toast.error("Please select a season first");
      return;
    }

    try {
      setIsPopulatingQueue(true);
      const response = await clientApiFetch<{
        message: string;
        season_id: number;
        total_players: number;
        queued_players: number;
        failed_players: number;
      }>(`/api/v1/sortter/season/${selectedSeason}/populate-kanaelo-queue`, {
        method: "POST"
      });

      toast.success(
        `Successfully added ${response.queued_players} players to the kanaelo calculation queue`
      );
    } catch (error) {
      console.error("Failed to populate kanaelo queue", error);
      toast.error("Failed to populate kanaelo queue");
    } finally {
      setIsPopulatingQueue(false);
    }
  };

  return (
    <WithRoleProtection allowedRoles={["admin"]}>
      <div className="space-y-4 w-full flex flex-col">
        <div className="flex flex-col space-y-2 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sortter</h1>
            <p className="text-muted-foreground">
              Team ranking management and analysis tool
            </p>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Season:</span>
              <SeasonSelector
                seasons={seasons}
                selectedSeason={selectedSeason}
                onChange={setSelectedSeason}
                isLoading={isLoadingSeasons}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={savePlacements}
                disabled={
                  !selectedSeason ||
                  isSaving ||
                  isLoadingPlacements ||
                  isViewMode
                }
                variant="outline"
                className="ml-auto"
              >
                {isSaving ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  "Save Placements"
                )}
              </Button>
              <Button
                onClick={finalizePlacements}
                disabled={
                  !selectedSeason ||
                  isFinalizing ||
                  isLoadingPlacements ||
                  isViewMode
                }
                variant="default"
                className="ml-auto"
              >
                {isFinalizing ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Finalizing...
                  </>
                ) : (
                  "Finalize Placements"
                )}
              </Button>
              <Button
                onClick={handlePopulateKanaeloQueue}
                disabled={!selectedSeason || isPopulatingQueue || isViewMode}
                variant="default"
                className="ml-auto"
              >
                {isPopulatingQueue ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Populating Queue...
                  </>
                ) : (
                  "Populate Kanaelo Queue"
                )}
              </Button>
              {isViewMode && (
                <div className="px-3 py-2 rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-sm font-medium">
                  View Mode - Placements have been finalized
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 border border-red-400 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <h5 className="text-sm font-medium text-red-800 dark:text-red-300">
              Error
            </h5>
            <div className="text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          </div>
        )}

        {/* Division Summary Card */}
        {!isLoadingTeams &&
          !isLoadingPlacements &&
          divisionSummary.length > 0 && (
            <Card className="flex-shrink-0">
              <CardHeader className="py-2">
                <CardTitle className="text-base">Division Summary</CardTitle>
              </CardHeader>
              <CardContent className="py-1">
                <div className="flex flex-wrap gap-2">
                  {divisionSummary.map((div) => (
                    <div
                      key={div.division}
                      className={`px-3 py-2 rounded-md text-base ${getRowColorClass(div.division - 1)}`}
                    >
                      <span className="font-medium">{div.name}:</span>{" "}
                      {div.count} teams
                    </div>
                  ))}
                  <div className="px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-base">
                    <span className="font-medium">Total:</span> {teams.length}{" "}
                    teams
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        <Card>
          <CardHeader>
            <CardTitle>Team Rankings</CardTitle>
            <CardDescription>
              View and manage team rankings with kanapoints analysis
              {teams.length > 0 && ` (${teams.length} teams)`}
              <span className="ml-2 text-xs text-muted-foreground italic">
                Double-click a team to view player details
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2">
            {isLoadingTeams || isLoadingPlacements ? (
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
                      <th className="text-left p-2 font-medium text-sm w-12">
                        ID
                      </th>
                      <th className="text-left p-2 font-medium text-sm w-36">
                        Team
                      </th>
                      <th className="text-left p-2 font-medium text-sm w-28">
                        kanaelo (sum 5 / avg4)
                      </th>
                      <th className="text-left p-2 font-medium text-sm w-28">
                        Division
                      </th>
                      <th className="text-center p-2 font-medium text-sm w-72">
                        Graph (0-350)
                      </th>
                      <th className="text-left p-2 font-medium text-sm w-72">
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
                      const teamDivision =
                        divisions[team.team_id] || Math.floor(index / 12) + 1;
                      const colorClass = getRowColorClass(teamDivision - 1);

                      // Check if this is the first team in a new division
                      const prevTeam = index > 0 ? teams[index - 1] : null;
                      const prevDivision = prevTeam
                        ? divisions[prevTeam.team_id] ||
                          Math.floor((index - 1) / 12) + 1
                        : null;
                      const isFirstInDivision = prevDivision !== teamDivision;

                      return (
                        <React.Fragment key={team.team_id}>
                          {isFirstInDivision && index > 0 && (
                            <tr className="border-t-4 border-gray-800 dark:border-gray-200">
                              <td colSpan={6} className="h-1 p-0"></td>
                            </tr>
                          )}
                          <tr
                            className={`border-b ${colorClass} transition-colors hover:bg-opacity-80 cursor-pointer`}
                            onDoubleClick={(e) =>
                              handleTeamDoubleClick(team.team_id, e)
                            }
                            onMouseEnter={() => handleTeamHover(team.team_id)}
                          >
                            <td className="py-4 px-2 font-medium text-sm">
                              {team.team_id}
                            </td>
                            <td className="py-4 px-2 font-medium text-sm">
                              {team.team_name}
                            </td>
                            <td className="py-4 px-2 text-sm">
                              <div className="font-medium">
                                {totalValue} / {avgValue}
                              </div>
                            </td>
                            <td className="py-4 px-2">
                              <Select
                                value={teamDivision.toString()}
                                onValueChange={(value) =>
                                  handleDivisionChange(
                                    team.team_id,
                                    parseInt(value, 10)
                                  )
                                }
                                disabled={isViewMode}
                              >
                                <SelectTrigger className="w-36 h-10 text-sm">
                                  <SelectValue placeholder="Division" />
                                </SelectTrigger>
                                <SelectContent>
                                  {divisionOptions.map((div) => (
                                    <SelectItem
                                      key={div.value}
                                      value={div.value.toString()}
                                    >
                                      {div.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="py-4 px-2">
                              <div className="w-full h-[120px]">
                                <MiniChart data={team.top5_values} />
                              </div>
                            </td>
                            <td className="p-2">
                              <Textarea
                                value={comments[team.team_id] || ""}
                                onChange={(e) =>
                                  handleCommentChange(
                                    team.team_id,
                                    e.target.value
                                  )
                                }
                                className="min-h-[120px] h-[120px] text-sm resize-none"
                                placeholder="Add comments..."
                                disabled={isViewMode}
                                rows={5}
                              />
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Floating player values window */}
        {selectedTeamId && floatingPosition && selectedTeam && (
          <PlayerValuesFloatingWindow
            playerValues={playerValues}
            teamName={selectedTeam.team_name}
            position={floatingPosition}
            isLoading={isLoadingPlayerValues}
            onClose={closeTeamPlayerValues}
          />
        )}
      </div>
    </WithRoleProtection>
  );
}
