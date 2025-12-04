"use client";

import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertCircle, RefreshCw, AlertTriangle, Filter } from "lucide-react";
import { FaceitRosterValidationTable } from "@/components/dashboard/faceit/FaceitRosterValidationTable";
import { useFaceitRosterValidation } from "@/hooks/data/dashboard/useFaceitRosterValidation";
import { useAllSeasons } from "@/hooks/data/useAllSeasons";
import { useState, useMemo } from "react";
import type {
  SeasonFaceitRosterValidation,
  ChampionshipValidationResult,
  FaceitTeamRosterComparison
} from "@eggosystem/types";

function FaceitRosterValidationContent() {
  const { seasons, isLoading: isLoadingSeasons } = useAllSeasons();
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | undefined>(
    undefined
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showOnlyViolations, setShowOnlyViolations] = useState(false);
  const [showOnlyNotifications, setShowOnlyNotifications] = useState(false);

  // Filter seasons to only show FaceIt seasons
  const faceitSeasons = useMemo(() => {
    if (!seasons) return [];
    return seasons
      .filter((season) => season.platform === "faceit")
      .sort((a, b) => b.id - a.id); // Newest first
  }, [seasons]);

  // Auto-select the newest FaceIt season on load
  useMemo(() => {
    if (!selectedSeasonId && faceitSeasons.length > 0) {
      setSelectedSeasonId(faceitSeasons[0]!.id);
    }
  }, [faceitSeasons, selectedSeasonId]);

  const { validation, isLoading, error, refresh } =
    useFaceitRosterValidation(selectedSeasonId);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter championships and teams based on selected filters
  const filteredValidation =
    useMemo((): SeasonFaceitRosterValidation | null => {
      if (!validation) return null;

      // If no filters active, return all data
      if (!showOnlyViolations && !showOnlyNotifications) {
        return validation as SeasonFaceitRosterValidation;
      }

      // Filter championships and their teams
      const filteredChampionships = validation.championships
        .map((championship: ChampionshipValidationResult) => {
          const filteredTeams = championship.teams.filter(
            (team: FaceitTeamRosterComparison) => {
              const hasViolations =
                team.players_in_faceit_not_in_hub.length > 0;
              const hasNotifications =
                team.players_in_hub_not_in_faceit.length > 0;

              if (showOnlyViolations && showOnlyNotifications) {
                // Show teams with either violations or notifications
                return hasViolations || hasNotifications;
              } else if (showOnlyViolations) {
                return hasViolations;
              } else if (showOnlyNotifications) {
                return hasNotifications;
              }

              return true;
            }
          );

          // Recalculate summary for filtered teams
          const teamsWithIssues = filteredTeams.filter(
            (t: FaceitTeamRosterComparison) =>
              t.players_in_faceit_not_in_hub.length > 0
          ).length;
          const totalRuleViolations = filteredTeams.reduce(
            (sum: number, t: FaceitTeamRosterComparison) =>
              sum + t.players_in_faceit_not_in_hub.length,
            0
          );
          const totalNotifications = filteredTeams.reduce(
            (sum: number, t: FaceitTeamRosterComparison) =>
              sum + t.players_in_hub_not_in_faceit.length,
            0
          );

          return {
            ...championship,
            teams: filteredTeams,
            summary: {
              total_teams: filteredTeams.length,
              teams_with_issues: teamsWithIssues,
              total_rule_violations: totalRuleViolations,
              total_unplayable_players: totalNotifications
            }
          };
        })
        .filter(
          (championship: ChampionshipValidationResult) =>
            championship.teams.length > 0
        ); // Remove empty championships

      // Recalculate overall summary
      const overallSummary = {
        total_teams: filteredChampionships.reduce(
          (sum: number, c: ChampionshipValidationResult) =>
            sum + c.summary.total_teams,
          0
        ),
        teams_with_issues: filteredChampionships.reduce(
          (sum: number, c: ChampionshipValidationResult) =>
            sum + c.summary.teams_with_issues,
          0
        ),
        total_rule_violations: filteredChampionships.reduce(
          (sum: number, c: ChampionshipValidationResult) =>
            sum + c.summary.total_rule_violations,
          0
        ),
        total_unplayable_players: filteredChampionships.reduce(
          (sum: number, c: ChampionshipValidationResult) =>
            sum + c.summary.total_unplayable_players,
          0
        )
      };

      return {
        season_id: validation.season_id,
        season_name: validation.season_name,
        championships: filteredChampionships,
        summary: overallSummary
      };
    }, [validation, showOnlyViolations, showOnlyNotifications]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">FaceIt Roster Validation</h1>
          <p className="text-muted-foreground mt-1">
            Validate all championship rosters to detect rule violations
          </p>
        </div>

        {selectedSeasonId && (
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        )}
      </div>

      {/* Season Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Season</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            This will validate ALL championships in the season at once
          </p>
        </CardHeader>
        <CardContent>
          {isLoadingSeasons ? (
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <span className="text-muted-foreground">Loading seasons...</span>
            </div>
          ) : faceitSeasons.length === 0 ? (
            <div className="text-muted-foreground">
              No FaceIt seasons available
            </div>
          ) : (
            <Select
              value={selectedSeasonId?.toString()}
              onValueChange={(value) =>
                setSelectedSeasonId(parseInt(value, 10))
              }
            >
              <SelectTrigger className="w-full md:w-[400px]">
                <SelectValue placeholder="Select a FaceIt season" />
              </SelectTrigger>
              <SelectContent>
                {faceitSeasons.map((season) => (
                  <SelectItem key={season.id} value={season.id.toString()}>
                    {season.full_name || season.name} (Season {season.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Filter Controls */}
      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-violations"
                  checked={showOnlyViolations}
                  onCheckedChange={(checked) =>
                    setShowOnlyViolations(checked === true)
                  }
                />
                <Label
                  htmlFor="show-violations"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Show only teams with rule violations
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-notifications"
                  checked={showOnlyNotifications}
                  onCheckedChange={(checked) =>
                    setShowOnlyNotifications(checked === true)
                  }
                />
                <Label
                  htmlFor="show-notifications"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Show only teams with notifications
                </Label>
              </div>
            </div>
            {(showOnlyViolations || showOnlyNotifications) && (
              <p className="text-xs text-muted-foreground mt-3">
                Showing filtered results. Uncheck filters to see all teams.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overall Summary Cards */}
      {filteredValidation && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredValidation.summary.total_teams}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {filteredValidation.championships.length} championship
                {filteredValidation.championships.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Teams with Rule Violations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {filteredValidation.summary.teams_with_issues}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Teams with unregistered players
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                Rule Violations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {filteredValidation.summary.total_rule_violations}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Players in FaceIt but NOT in HUB
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {filteredValidation.summary.total_unplayable_players}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Players in HUB but NOT in FaceIt (informational)
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Validation Results */}
      {!selectedSeasonId ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Please select a season to begin validation
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Spinner />
            <p className="text-muted-foreground">
              Fetching and validating all championships...
            </p>
          </div>
        </div>
      ) : error ? (
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>Failed to load validation data. Please try again.</span>
            </div>
          </CardContent>
        </Card>
      ) : filteredValidation ? (
        <>
          {filteredValidation.championships.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  No championships found for this season.
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Group by Championship */}
              {filteredValidation.championships.map(
                (championship: ChampionshipValidationResult) => {
                  const hasViolations =
                    championship.summary.teams_with_issues > 0;
                  const hasNotifications =
                    championship.summary.total_unplayable_players > 0;

                  return (
                    <Card key={championship.championship_id} className="mt-4">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <CardTitle className="text-lg">
                                {championship.stage_name}
                              </CardTitle>
                              {hasViolations && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded-full">
                                  <AlertCircle className="w-4 h-4" />
                                  {championship.summary.teams_with_issues} team
                                  {championship.summary.teams_with_issues !== 1
                                    ? "s"
                                    : ""}{" "}
                                  with violations
                                </span>
                              )}
                              {!hasViolations && hasNotifications && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                                  <AlertCircle className="w-4 h-4" />
                                  {
                                    championship.summary
                                      .total_unplayable_players
                                  }{" "}
                                  notification
                                  {championship.summary
                                    .total_unplayable_players !== 1
                                    ? "s"
                                    : ""}
                                </span>
                              )}
                              {!hasViolations && !hasNotifications && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm font-semibold rounded-full">
                                  ✓ All Clear
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              {championship.championship_name} •{" "}
                              {championship.summary.total_teams} teams
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        {championship.teams.length === 0 ? (
                          <div className="text-center text-muted-foreground py-8">
                            No teams found in this championship
                          </div>
                        ) : (
                          <FaceitRosterValidationTable
                            teams={championship.teams}
                            championshipId={championship.championship_id}
                            stageName={championship.stage_name}
                            seasonId={selectedSeasonId}
                          />
                        )}
                      </CardContent>
                    </Card>
                  );
                }
              )}
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

export default function FaceitRosterValidationPage() {
  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <FaceitRosterValidationContent />
    </WithRoleProtection>
  );
}
