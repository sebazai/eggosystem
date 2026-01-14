"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { useDashboardSeason } from "@/hooks/data/dashboard/useDashboardSeason";
import { SelectedSeasonBadge } from "@/components/dashboard/SelectedSeasonBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertTriangle,
  RefreshCw,
  Calendar,
  Users,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { clientApiFetch } from "@/lib/apiClient";

interface TeamFlagData {
  season_id: number;
  league_id: number;
  team_id: number;
  flagged: boolean;
  reason: string;
  flagged_players: string[];
  timestamp: string;
}

interface EloAdjustmentData {
  steam_id: string;
  season_id: number;
  league_id: number;
  team_id: number;
  offered_elo: number;
  adjusted_elo: number;
  adjustment_reason: string;
  timestamp: string;
}

interface TeamFlagWithDetails extends TeamFlagData {
  adjustments: EloAdjustmentData[];
  team_name?: string;
  league_name?: string;
  season_name?: string;
}

export default function TeamFlagsPage() {
  const { selectedSeasonId } = useDashboardSeason();

  // Use shared season from URL, or "all" if not set
  const selectedSeason: number | "all" = selectedSeasonId
    ? Number(selectedSeasonId)
    : "all";

  const [teamFlags, setTeamFlags] = useState<TeamFlagWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter flags by selected season
  const filteredFlags = useMemo(() => {
    if (selectedSeason === "all") return teamFlags;
    return teamFlags.filter((flag) => flag.season_id === selectedSeason);
  }, [teamFlags, selectedSeason]);

  const fetchTeamFlags = useCallback(
    async (seasonToFetch?: number | "all") => {
      try {
        console.log(
          "Fetching team flags for season:",
          seasonToFetch || selectedSeason
        );
        // Use the test route that doesn't require authentication for now
        // Pass season_id parameter if a specific season is selected
        const season =
          seasonToFetch !== undefined ? seasonToFetch : selectedSeason;
        const seasonParam = season !== "all" ? `?season_id=${season}` : "";
        const data = await clientApiFetch<TeamFlagWithDetails[]>(
          `/api/v1/elo/team-flags-test${seasonParam}`
        );
        console.log("Team flags data received:", data);
        setTeamFlags(data || []);
      } catch (error) {
        console.error("Error fetching team flags:", error);
        // Show more detailed error message
        if (error instanceof Error) {
          toast.error(`Failed to load team flags: ${error.message}`);
        } else {
          toast.error("Failed to load team flags");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [selectedSeason]
  );

  const refreshData = async () => {
    setIsRefreshing(true);
    await fetchTeamFlags();
    setIsRefreshing(false);
    toast.success("Team flags refreshed");
  };

  const refreshFromDatabase = async () => {
    try {
      setIsRefreshing(true);
      toast.info("Refreshing team flags from database...");

      // If a specific season is selected, create flags for that season
      if (selectedSeason !== "all") {
        await clientApiFetch(
          `/api/v1/dashboard/sortter/team-flags/season/${selectedSeason}`,
          {
            method: "POST"
          }
        );
        toast.info(`Creating team flags for season ${selectedSeason}...`);
      } else {
        await clientApiFetch("/api/v1/dashboard/sortter/team-flags", {
          method: "POST"
        });
        toast.info("Creating team flags for all seasons...");
      }

      // Wait a moment for the backend to process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Fetch the updated data
      await fetchTeamFlags();

      toast.success("Team flags refreshed from database");
    } catch (error) {
      console.error("Error refreshing from database:", error);
      toast.error("Failed to refresh from database");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeamFlags();
  }, [fetchTeamFlags]); // Re-fetch when season changes

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getEloDifference = (offered: number, adjusted: number) => {
    const diff = adjusted - offered;
    const percentage = ((diff / offered) * 100).toFixed(1);
    return { diff, percentage };
  };

  const getEloDifferenceColor = (diff: number) => {
    if (Math.abs(diff) <= 10)
      return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
    if (Math.abs(diff) <= 20)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
    if (Math.abs(diff) <= 30)
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300";
    return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
  };

  if (isLoading) {
    return (
      <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      </WithRoleProtection>
    );
  }

  return (
    <WithRoleProtection allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Team Flagging Status
              </h1>
            </div>
            <p className="text-muted-foreground">
              Monitor teams flagged for ELO adjustment validation
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedSeason === "all" ? (
              <span className="text-sm text-muted-foreground">
                Select a season from the sidebar to filter team flags
              </span>
            ) : (
              <SelectedSeasonBadge />
            )}
            <Button onClick={refreshData} disabled={isRefreshing}>
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              onClick={refreshFromDatabase}
              disabled={isRefreshing}
              variant="outline"
              className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh from DB
            </Button>
          </div>
        </div>

        {/* Flagging criteria information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Flagging Criteria</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              Teams are automatically flagged when they meet the following
              criterion:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Individual Player Threshold:</strong> Three or more
                players have ELO adjustments greater than 15 points
              </li>
            </ul>
            <div className="pt-2">
              <h4 className="font-medium mb-1">ELO Difference Color Coding:</h4>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                >
                  ≤ 10 points
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
                >
                  11-20 points
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300"
                >
                  21-30 points
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                >
                  {">"}30 points
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredFlags.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Team Flags Found
              </h3>
              <p className="text-muted-foreground text-center">
                All teams are currently within acceptable ELO adjustment limits.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredFlags.map((flag) => (
              <Card key={`${flag.season_id}-${flag.league_id}-${flag.team_id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        Team {flag.team_id} Flagged
                      </CardTitle>
                      <CardDescription>
                        <span className="font-medium">
                          Season {flag.season_id}
                        </span>{" "}
                        • League {flag.league_id}
                        {flag.team_name && ` • ${flag.team_name}`}
                      </CardDescription>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      Flagged
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-orange-100 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-2">
                      Flag Reason
                    </h4>
                    <p className="text-orange-700 dark:text-orange-400 text-sm">
                      {flag.reason}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Flagged: {formatTimestamp(flag.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>
                        <strong className="text-orange-600">
                          {flag.flagged_players.length}
                        </strong>{" "}
                        players flagged out of {flag.adjustments.length} total
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                      <span>
                        Season {flag.season_id}, League {flag.league_id}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">
                      Player ELO Adjustments
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b text-xs text-muted-foreground">
                            <th className="text-left py-2 px-3 font-medium">
                              Player ID
                            </th>
                            <th className="text-left py-2 px-3 font-medium">
                              Offered ELO
                            </th>
                            <th className="text-left py-2 px-3 font-medium">
                              Adjusted ELO
                            </th>
                            <th className="text-left py-2 px-3 font-medium">
                              Difference
                            </th>
                            <th className="text-left py-2 px-3 font-medium">
                              Flagged
                            </th>
                            <th className="text-left py-2 px-3 font-medium">
                              Timestamp
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {flag.adjustments.map((adjustment) => {
                            const { diff, percentage } = getEloDifference(
                              adjustment.offered_elo,
                              adjustment.adjusted_elo
                            );
                            const isHighAdjustment = Math.abs(diff) > 15;
                            const isFlagged = flag.flagged_players.includes(
                              adjustment.steam_id
                            );

                            return (
                              <tr
                                key={adjustment.steam_id}
                                className={`hover:bg-muted/70 ${
                                  isFlagged
                                    ? "bg-orange-100 dark:bg-orange-900/40"
                                    : isHighAdjustment
                                      ? "bg-orange-50 dark:bg-orange-950/30"
                                      : ""
                                }`}
                              >
                                <td className="py-2 px-3">
                                  <span
                                    className={`font-mono text-sm ${isFlagged ? "font-semibold" : ""}`}
                                  >
                                    {adjustment.steam_id}
                                  </span>
                                </td>
                                <td className="py-2 px-3">
                                  <span
                                    className={`${isFlagged ? "font-semibold" : ""}`}
                                  >
                                    {adjustment.offered_elo}
                                  </span>
                                </td>
                                <td className="py-2 px-3">
                                  <span
                                    className={`${isFlagged ? "font-semibold" : ""}`}
                                  >
                                    {adjustment.adjusted_elo}
                                  </span>
                                </td>
                                <td className="py-2 px-3">
                                  <Badge
                                    variant="secondary"
                                    className={`${getEloDifferenceColor(diff)} ${
                                      isFlagged ? "font-semibold" : ""
                                    }`}
                                  >
                                    {diff > 0 ? "+" : ""}
                                    {diff} ({percentage}%)
                                  </Badge>
                                </td>
                                <td className="py-2 px-3">
                                  {isFlagged ? (
                                    <Badge
                                      variant="destructive"
                                      className="text-xs font-semibold"
                                    >
                                      Yes
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">
                                      No
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  <span className="text-xs text-muted-foreground">
                                    {formatTimestamp(adjustment.timestamp)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {flag.flagged_players.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-2">
                        Flagged Players Summary
                      </h4>
                      <div className="bg-orange-100 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 rounded-lg p-3">
                        <p className="text-sm text-orange-800 dark:text-orange-300 mb-2">
                          The following players triggered the flag with ELO
                          adjustments greater than 15 points:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {flag.flagged_players.map((steamId) => {
                            const playerAdjustment = flag.adjustments.find(
                              (adj) => adj.steam_id === steamId
                            );
                            if (!playerAdjustment) return null;

                            const { diff } = getEloDifference(
                              playerAdjustment.offered_elo,
                              playerAdjustment.adjusted_elo
                            );

                            return (
                              <div
                                key={steamId}
                                className="flex flex-col bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700/50 rounded p-2 text-xs"
                              >
                                <span className="font-mono font-medium dark:text-gray-200">
                                  {steamId}
                                </span>
                                <span className="mt-1 dark:text-gray-300">
                                  {playerAdjustment.offered_elo} →{" "}
                                  {playerAdjustment.adjusted_elo}
                                  <span
                                    className={`ml-1 font-semibold ${
                                      diff > 0
                                        ? "text-red-600 dark:text-red-400"
                                        : "text-blue-600 dark:text-blue-400"
                                    }`}
                                  >
                                    ({diff > 0 ? "+" : ""}
                                    {diff})
                                  </span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </WithRoleProtection>
  );
}
