"use client";

import { useState, useEffect } from "react";
import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

import { useActiveSignupOrActiveSeasonForApp } from "@/hooks/data/useActiveSignupOrActiveSeasonForApp";
import { useAllSeasons } from "@/hooks/data/useAllSeasons";
import { useDashboardSeasonTeams } from "@/hooks/data/useDashboardSeasonTeams";
import { usePlayerTeamEligibility } from "@/hooks/data/usePlayerTeamEligibility";
import { usePlayerValidation } from "@/hooks/data/dashboard/usePlayerValidation";
import { useAddPlayer } from "@/hooks/data/useAddPlayer";
import { PlayerValidationDisplay } from "@/components/dashboard/PlayerValidationDisplay";
import { PlayerValidationForm } from "@/components/dashboard/PlayerValidationForm";

export default function AddPlayerPage() {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [steamId, setSteamId] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Get all seasons
  const { seasons, isLoading: isLoadingSeasons } = useAllSeasons();

  // Get active season (app_id 730 for CS)
  const { signupOrActiveSeason: activeSeason } =
    useActiveSignupOrActiveSeasonForApp(730);

  // Get teams for the selected season
  const { teams, isLoading: isLoadingTeams } =
    useDashboardSeasonTeams(selectedSeasonId);

  // Get player validation hook
  const {
    validationResult,
    isValidating,
    error: validationError,
    validatePlayer,
    clearResults: clearValidationResults
  } = usePlayerValidation();

  // Get player eligibility check
  const {
    eligibilityResult,
    isLoading: isChecking,
    isError: eligibilityError,
    checkEligibility,
    clearResult
  } = usePlayerTeamEligibility(selectedSeasonId, selectedTeamId, steamId);

  // Add player hook
  const { addPlayer } = useAddPlayer();

  // Set selected season to active season when it loads
  useEffect(() => {
    if (activeSeason && !selectedSeasonId) {
      setSelectedSeasonId(activeSeason.season_id.toString());
    }
  }, [activeSeason, selectedSeasonId]);

  // Handle eligibility check errors from SWR
  useEffect(() => {
    if (eligibilityError) {
      // Error is handled by the eligibilityError display in the UI
      console.error("Eligibility check failed:", eligibilityError);
    }
  }, [eligibilityError]);

  const handleValidatePlayer = async () => {
    setSuccess(null);

    try {
      await validatePlayer(steamId, selectedSeasonId);
      // Success case - validationResult will be updated by the hook
    } catch (err) {
      // Error case - the error will be handled by the PlayerValidationForm component
      // via the validationError prop from the hook
      console.error("Validation failed:", err);
    }
  };

  const handleCheckEligibility = async () => {
    setSuccess(null);

    try {
      await checkEligibility();
    } catch (err) {
      // Error is handled by the eligibilityError from the hook
      console.error("Eligibility check failed:", err);
    }
  };

  const handleSeasonChange = (value: string) => {
    setSelectedSeasonId(value);
    // Clear team selection and results when season changes
    setSelectedTeamId("");
    clearValidationResults();
    clearResult();
    setSuccess(null);
  };

  const handleSteamIdChange = (value: string) => {
    setSteamId(value);
    // Clear results when steam ID changes - but only if the value actually changed
    if (value !== steamId) {
      clearValidationResults();
      clearResult();
      setSuccess(null);
    }
  };

  const handleTeamChange = (value: string) => {
    setSelectedTeamId(value);
    // Clear results when team changes
    clearResult();
    setSuccess(null);
  };

  const handleAddPlayer = async () => {
    if (!eligibilityResult || !selectedSeasonId) {
      return;
    }

    setIsAdding(true);
    setSuccess(null);

    try {
      await addPlayer(selectedSeasonId, selectedTeamId, steamId, {
        kana_elo: eligibilityResult.selectedTeam.new_player_kana_elo,
        calculus: eligibilityResult.selectedTeam.csrankker_components || {}
      });

      setSuccess(
        `Player successfully added to ${eligibilityResult.selectedTeam.team_name}`
      );

      // Clear validation and eligibility check results after successful addition
      clearValidationResults();
      clearResult();
    } catch (err) {
      // For now, just log the error - could add a toast notification or other error handling
      console.error("Failed to add player:", err);
      setSuccess(null);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <div className="flex flex-1 flex-col gap-6 p-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Add Player</h1>
          <p className="text-muted-foreground">
            Check if a player can be added to a team based on kana_elo balance
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Player Addition Check</CardTitle>
              <CardDescription>
                Select a season, team and enter a Steam ID to check eligibility
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Player Validation Form */}
              <PlayerValidationForm
                steamId={steamId}
                setSteamId={handleSteamIdChange}
                seasonId={selectedSeasonId}
                setSeasonId={handleSeasonChange}
                seasons={seasons}
                isLoadingSeasons={isLoadingSeasons}
                isValidating={isValidating}
                error={validationError}
                onValidate={handleValidatePlayer}
                activeSeason={activeSeason}
                buttonText="1. Validate Player"
                data-testid="validate-player-button"
              />

              {/* Team Selector */}
              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <Select
                  value={selectedTeamId}
                  onValueChange={handleTeamChange}
                  data-testid="team-select"
                >
                  <SelectTrigger data-testid="team-selector">
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent data-testid="team-dropdown">
                    {isLoadingTeams ? (
                      <SelectItem
                        value="loading"
                        disabled
                        data-testid="loading-option"
                      >
                        Loading teams...
                      </SelectItem>
                    ) : teams && teams.length > 0 ? (
                      teams.map((team) => (
                        <SelectItem
                          key={team.team_id}
                          value={team.team_id.toString()}
                          data-value={team.team_id.toString()}
                          data-testid={`team-option-${team.team_id}`}
                        >
                          {team.team_name} ({team.league_name})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem
                        value="no-teams"
                        disabled
                        data-testid="no-teams-option"
                      >
                        No teams available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Check Eligibility Button */}
              <Button
                onClick={handleCheckEligibility}
                disabled={
                  !selectedSeasonId ||
                  !selectedTeamId ||
                  !steamId ||
                  isChecking ||
                  !validationResult ||
                  !validationResult.overall_success
                }
                className="w-full"
                data-testid="check-eligibility-button"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "2. Check Team Eligibility"
                )}
              </Button>

              {/* Eligibility Error Display */}
              {eligibilityError && (
                <Alert
                  variant="destructive"
                  data-testid="eligibility-error-message"
                >
                  <AlertDescription>
                    {eligibilityError instanceof Error
                      ? eligibilityError.message
                      : "Failed to check eligibility"}
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {success && (
                <Alert
                  variant="default"
                  className="border-green-500 bg-green-50 dark:bg-green-900/20"
                  data-testid="success-message"
                >
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    {success}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Validation Results Display */}
          {validationResult && (
            <PlayerValidationDisplay
              validationResult={validationResult}
              variant="compact"
            />
          )}

          {/* Eligibility Results Display */}
          {eligibilityResult && (
            <Card>
              <CardHeader>
                <CardTitle
                  className="flex items-center gap-2"
                  data-testid={
                    eligibilityResult.canAddPlayer
                      ? "eligibility-success"
                      : "eligibility-failure"
                  }
                >
                  {eligibilityResult.canAddPlayer ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Can Add Player
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      Cannot Add Player
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  Analysis for {eligibilityResult.selectedTeam.team_name} in{" "}
                  {eligibilityResult.league_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Selected Team Analysis */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Selected Team Analysis</h3>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Current Top 3 Average:</span>
                      <span className="font-mono">
                        {eligibilityResult.selectedTeam.current_top3_avg}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Top 4 Average:</span>
                      <span className="font-mono">
                        {eligibilityResult.selectedTeam.current_top4_avg}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>New Player Stabilized Kana Elo:</span>
                      <span className="font-mono">
                        {eligibilityResult.selectedTeam.new_player_kana_elo}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>New Average (Top 3 + New Player):</span>
                      <span className="font-mono font-semibold">
                        {eligibilityResult.selectedTeam.new_avg_with_player}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CSRankker Components */}
                {eligibilityResult.selectedTeam.csrankker_components && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">CSRankker Components</h3>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span>True Level:</span>
                        <span className="font-mono">
                          {
                            eligibilityResult.selectedTeam.csrankker_components
                              .trueLevel
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Matchmaking:</span>
                        <span className="font-mono">
                          {
                            eligibilityResult.selectedTeam.csrankker_components
                              .mm
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hours:</span>
                        <span className="font-mono">
                          {
                            eligibilityResult.selectedTeam.csrankker_components
                              .hour
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Kana Rating:</span>
                        <span className="font-mono">
                          {
                            eligibilityResult.selectedTeam.csrankker_components
                              .kana
                          }
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-medium">
                          Total (Original Kana Elo):
                        </span>
                        <span className="font-mono font-semibold">
                          {eligibilityResult.selectedTeam.csrankker_components
                            .trueLevel +
                            eligibilityResult.selectedTeam.csrankker_components
                              .mm +
                            eligibilityResult.selectedTeam.csrankker_components
                              .hour +
                            eligibilityResult.selectedTeam.csrankker_components
                              .kana}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                        <span>
                          Note: The stabilized value is used for team
                          calculations
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Teams in League */}
                <div className="space-y-3">
                  <h3 className="font-semibold">
                    Top 3 Teams in {eligibilityResult.league_name}
                  </h3>
                  <div className="space-y-2">
                    {eligibilityResult.topTeamsInLeague.map((team) => (
                      <div
                        key={team.team_id}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">#{team.rank}</Badge>
                          <span className="font-medium">{team.team_name}</span>
                        </div>
                        <span className="font-mono text-sm">
                          Avg4: {team.avg4}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Final Result */}
                <Alert
                  variant={
                    eligibilityResult.canAddPlayer ? "default" : "destructive"
                  }
                  data-testid="eligibility-message"
                >
                  <AlertDescription>
                    {eligibilityResult.canAddPlayer
                      ? `The new average (${eligibilityResult.selectedTeam.new_avg_with_player}) is lower than or equal to the top team's average (${eligibilityResult.topTeamsInLeague[0]?.avg4}), so the player can be added.`
                      : `The new average (${eligibilityResult.selectedTeam.new_avg_with_player}) is higher than the top team's average (${eligibilityResult.topTeamsInLeague[0]?.avg4}), so the player cannot be added.`}
                  </AlertDescription>
                </Alert>

                {/* Add Player Button */}
                {eligibilityResult.canAddPlayer && (
                  <Button
                    onClick={handleAddPlayer}
                    disabled={isAdding}
                    className="w-full"
                    variant="default"
                    data-testid="add-player-button"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Player...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        3. Add Player to Team
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </WithRoleProtection>
  );
}
