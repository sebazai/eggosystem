"use client";

import { useState, useRef } from "react";
import { useSortter } from "@/hooks/data/dashboard/useSortter";
import { SelectedSeasonBadge } from "@/components/dashboard/SelectedSeasonBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { PlayerValuesFloatingWindow } from "@/components/dashboard/PlayerValuesFloatingWindow";
import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { CommentsProvider, useComments } from "@/contexts/CommentsContext";
import { toast } from "sonner";
import { clientApiFetch } from "@/lib/apiClient";
import { TOP_N_FOR_COMPARISON } from "@eggosystem/types";
// Removed unused imports
import MemoizedDivisionDropdown from "@/components/sortter/MemoizedDivisionDropdown";
import React from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import { XAxis, YAxis, Area, AreaChart, CartesianGrid } from "recharts";
import { AlertTriangle } from "lucide-react";
import { TeamHistoryBadge } from "@/components/sortter/TeamHistoryBadge";

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

// Check if error is specifically about missing kanaelo data
const isKanaeloMissingError = (error: unknown): boolean => {
  if (!error) return false;
  const errorString = error.toString().toLowerCase();
  return (
    errorString.includes("kana_elo") &&
    ((errorString.includes("not") && errorString.includes("calculated")) ||
      errorString.includes("missing") ||
      errorString.includes("invalid"))
  );
};

// Wrapper component that provides the CommentsContext
function SortterPageContent() {
  // Teams per division selector - used when generating initial placements
  const [teamsPerDivision, setTeamsPerDivision] = useState<number>(16);
  // Get comments from the context
  const { comments, setCommentForTeam } = useComments();

  // Use refs to store comment textarea elements without triggering re-renders
  const commentRefs = useRef<{ [key: number]: HTMLTextAreaElement | null }>({});

  const {
    teams,
    playerValues,
    placements,
    selectedSeason,
    selectedTeamId,
    floatingPosition,
    divisions,
    isLoadingTeams,
    isLoadingPlayerValues,
    isLoadingPlacements,
    isSaving,
    isFinalizing,
    error,
    showTeamPlayerValues,
    closeTeamPlayerValues,
    prefetchPlayerValues,
    handleDivisionChange,
    savePlacements,
    finalizePlacements,
    isViewMode
  } = useSortter(teamsPerDivision);

  const [isPopulatingQueue, setIsPopulatingQueue] = useState(false);

  // Use shared calculation function that uses centralized constants
  // To change from avg of 4 to avg of 5, update @eggosystem/types/calculations/team-balance-config
  const calculateAvg = React.useCallback((values: number[]) => {
    // Import from utils which uses constants from @eggosystem/types
    // This constant is defined in: packages/types/src/calculations/team-balance-config.ts
    if (!values || values.length < TOP_N_FOR_COMPARISON) {
      const count = values?.length || 0;
      if (count === 0) return "0";
      return (values.reduce((sum, val) => sum + val, 0) / count).toFixed(3);
    }
    const topValues = values.slice(0, TOP_N_FOR_COMPARISON);
    return (
      topValues.reduce((sum, val) => sum + val, 0) / TOP_N_FOR_COMPARISON
    ).toFixed(3);
  }, []);

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

  // Track the max division number (can be increased by user)
  const [maxDivision, setMaxDivision] = React.useState<number>(0);

  // Calculate the actual max division based on teams
  const calculatedMaxDivision = React.useMemo(() => {
    if (!teams.length) return 0;

    // Find the highest actual division number
    const actualMaxDivision = Math.max(
      ...teams.map(
        (team) =>
          team.division ??
          divisions[team.team_id] ??
          (placements && placements.length > 0
            ? 1
            : Math.floor(teams.indexOf(team) / teamsPerDivision) + 1)
      )
    );

    return actualMaxDivision;
  }, [teams, divisions, placements, teamsPerDivision]);

  // Update maxDivision when calculatedMaxDivision changes
  React.useEffect(() => {
    if (calculatedMaxDivision > maxDivision) {
      setMaxDivision(calculatedMaxDivision);
    }
  }, [calculatedMaxDivision, maxDivision]);

  // Memoize division options to prevent recalculation on every render
  const divisionOptions = React.useMemo(
    () => generateDivisionOptions(maxDivision),
    [maxDivision]
  );

  // Handle adding a new division
  const handleAddNewDivision = React.useCallback(() => {
    if (isViewMode) {
      toast.error("Cannot add divisions - placements have been finalized");
      return;
    }
    // Increment the max division to add a new one
    setMaxDivision((prev) => prev + 1);
    toast.success(`Added ${getDivisionName(maxDivision + 1)}`, {
      duration: 2000,
      position: "bottom-right"
    });
  }, [maxDivision, isViewMode]);

  // Calculate division summary
  const divisionSummary = React.useMemo(() => {
    if (!teams.length) return [];

    // Create a map to count teams per division
    const divisionCounts = new Map<number, number>();

    // Count teams in each division
    teams.forEach((team, index) => {
      // Use the same logic as the team rendering
      const divisionNumber =
        team.division ??
        divisions[team.team_id] ??
        (placements && placements.length > 0
          ? 1
          : Math.floor(index / teamsPerDivision) + 1);

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
  }, [teams, divisions, maxDivision, placements, teamsPerDivision]);

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
      }>(
        `/api/v1/dashboard/sortter/season/${selectedSeason}/populate-kanaelo-queue`,
        {
          method: "POST"
        }
      );

      toast.success(
        `Successfully added ${response.queued_players} players to the kanaelo calculation queue`
      );
    } catch (_error) {
      toast.error("Failed to populate kanaelo queue");
    } finally {
      setIsPopulatingQueue(false);
    }
  };

  // State for retry failed calculations
  const [isRetrying, setIsRetrying] = useState(false);

  // Handle retrying failed kanaelo calculations
  const handleRetryFailedCalculations = async () => {
    try {
      setIsRetrying(true);
      const response = await clientApiFetch<{
        message: string;
        moved: number;
        errors: number;
        total: number;
      }>(`/api/v1/dashboard/sortter/retry-failed-calculations`, {
        method: "POST"
      });

      toast.success(response.message);
    } catch (_error) {
      toast.error("Failed to retry failed calculations");
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <WithRoleProtection allowedRoles={["admin"]}>
      <div className="space-y-4 w-full flex flex-col">
        <div className="flex flex-col space-y-2 flex-shrink-0">
          <div>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight">Sortter</h1>
              <SelectedSeasonBadge />
            </div>
            <p className="text-muted-foreground">
              Team ranking management and analysis tool
            </p>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              {selectedSeason ? (
                <SelectedSeasonBadge />
              ) : (
                <span className="text-sm text-muted-foreground">
                  Please select a season from the sidebar
                </span>
              )}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Teams per Division:</span>
                <Select
                  value={teamsPerDivision.toString()}
                  onValueChange={(value) => setTeamsPerDivision(Number(value))}
                  disabled={isViewMode}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="16">16</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => savePlacements()}
                disabled={
                  !selectedSeason ||
                  isSaving ||
                  isLoadingPlacements ||
                  isViewMode ||
                  error // Disable when ANY error is present (including kana_elo errors)
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
                  isViewMode ||
                  error // Disable when ANY error is present (including kana_elo errors)
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

              <Button
                onClick={handleRetryFailedCalculations}
                disabled={isRetrying}
                variant="outline"
                className="ml-2"
              >
                {isRetrying ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Retry Failed Calculations
                  </>
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

        {error && !isKanaeloMissingError(error) && (
          <div className="p-4 border border-red-400 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <h5 className="text-sm font-medium text-red-800 dark:text-red-300">
              Error
            </h5>
            <div className="text-sm text-red-700 dark:text-red-400">
              {error.toString()}
            </div>
          </div>
        )}

        {error && isKanaeloMissingError(error) && (
          <div className="p-4 border border-amber-400 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
            <h5 className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Kanaelo Data Required
            </h5>
            <div className="text-sm text-amber-700 dark:text-amber-400">
              Team placements cannot be generated because kana_elo data has not
              been calculated yet. Please click &quot;Populate Kanaelo
              Queue&quot; to start the calculation process.
            </div>
          </div>
        )}

        {/* Division Summary Card */}
        {!isLoadingTeams &&
          !isLoadingPlacements &&
          divisionSummary.length > 0 &&
          !(error && isKanaeloMissingError(error)) && (
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

        {/* Only show teams table if we don't have a kanaelo missing error */}
        {!(error && isKanaeloMissingError(error)) && (
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
                        <th className="text-left p-2 font-medium text-sm w-36">
                          kanaelo (sum 5 / avg5 / orig5)
                        </th>
                        <th className="text-left p-2 font-medium text-sm w-28">
                          Division
                        </th>
                        <th className="text-center p-2 font-medium text-sm w-72">
                          Graph (0-350)
                        </th>
                        <th className="text-left p-2 font-medium text-sm w-48">
                          History
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
                          divisions[team.team_id] ?? // Local changes take precedence
                          team.division ?? // Then original placement
                          (placements && placements.length > 0
                            ? 1
                            : Math.floor(index / teamsPerDivision) + 1);
                        const colorClass = getRowColorClass(teamDivision - 1);

                        // Check if this is the first team in a new division
                        const prevTeam = index > 0 ? teams[index - 1] : null;
                        const prevDivision = prevTeam
                          ? (prevTeam.division ??
                            divisions[prevTeam.team_id] ??
                            (placements && placements.length > 0
                              ? 1
                              : Math.floor((index - 1) / teamsPerDivision) + 1))
                          : null;
                        const isFirstInDivision = prevDivision !== teamDivision;

                        return (
                          <React.Fragment key={team.team_id}>
                            {isFirstInDivision && index > 0 && (
                              <tr className="border-t-4 border-gray-800 dark:border-gray-200">
                                <td colSpan={7} className="h-1 p-0"></td>
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
                                <div className="font-medium flex items-center gap-2">
                                  {team.is_flagged && (
                                    <AlertTriangle
                                      className="h-4 w-4 text-orange-600 dark:text-orange-400"
                                      aria-label="Team flagged for ELO adjustments"
                                    />
                                  )}
                                  <span>
                                    {totalValue} / {avgValue} /{" "}
                                    {team.orig5 ? team.orig5.toFixed(3) : "N/A"}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-2">
                                <MemoizedDivisionDropdown
                                  teamId={team.team_id}
                                  value={teamDivision.toString()}
                                  options={divisionOptions}
                                  disabled={isViewMode}
                                  onValueChange={handleDivisionChange}
                                  onAddNewDivision={handleAddNewDivision}
                                  originalValue={team.division}
                                />
                              </td>
                              <td className="py-4 px-2">
                                <div className="w-full h-[120px]">
                                  <MiniChart data={team.top5_values} />
                                </div>
                              </td>
                              <td className="p-2">
                                <TeamHistoryBadge
                                  seasonId={selectedSeason}
                                  teamId={team.team_id}
                                />
                              </td>
                              <td className="p-2">
                                <Textarea
                                  defaultValue={
                                    (comments[team.team_id] === " "
                                      ? ""
                                      : comments[team.team_id]) || ""
                                  }
                                  ref={(el) => {
                                    if (el) {
                                      // Store the ref for this team
                                      commentRefs.current[team.team_id] = el;
                                    }
                                  }}
                                  onBlur={async () => {
                                    const textarea =
                                      commentRefs.current[team.team_id];
                                    if (!textarea) return;

                                    const newValue = textarea.value;
                                    const currentValue =
                                      comments[team.team_id] || "";

                                    console.log(
                                      `Comment check for team ${team.team_id}: current="${currentValue}" new="${newValue}"`
                                    );

                                    // Always update context and save if there's any change
                                    // This handles both setting and clearing comments
                                    if (currentValue !== newValue) {
                                      // Convert empty string to space character for "empty" comments
                                      const commentToSave =
                                        newValue === "" ? " " : newValue;

                                      // Update comment in context without auto-save
                                      setCommentForTeam(
                                        team.team_id,
                                        commentToSave,
                                        false // Disable auto-save
                                      );

                                      // Save immediately with the new comment value
                                      try {
                                        const updatedComments = {
                                          ...comments,
                                          [team.team_id]: commentToSave
                                        };
                                        await savePlacements(updatedComments);
                                        console.log(
                                          `Comment saved for team ${team.team_id}`
                                        );
                                      } catch (error) {
                                        console.error(
                                          `Failed to save comment for team ${team.team_id}:`,
                                          error
                                        );
                                      }
                                    }
                                  }}
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
        )}

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

// Export the page with CommentsProvider
export default function SortterPage() {
  return (
    <CommentsProvider>
      <SortterPageContent />
    </CommentsProvider>
  );
}
