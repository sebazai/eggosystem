"use client";

import { useState, useEffect } from "react";
import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle } from "lucide-react";

import { useActiveSignupOrActiveSeasonForApp } from "@/hooks/data/useActiveSignupOrActiveSeasonForApp";
import { useAllSeasons } from "@/hooks/data/useAllSeasons";
import { useDashboardSeasonTeams } from "@/hooks/data/useDashboardSeasonTeams";
import { usePlayerValidation } from "@/hooks/data/dashboard/usePlayerValidation";
import { useAddSubstitutePlayer } from "@/hooks/data/useAddSubstitutePlayer";
import { PlayerValidationDisplay } from "@/components/dashboard/PlayerValidationDisplay";
import { PlayerValidationForm } from "@/components/dashboard/PlayerValidationForm";
import { convertSteamIdToSteamId64 } from "@/lib/utils";
import { ApiError } from "@/lib/apiClient";

export default function AddSubstitutePlayerPage() {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [steamId, setSteamId] = useState<string>("");
  const [matchId, setMatchId] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

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

  // Add substitute player hook
  const { addSubstitutePlayer } = useAddSubstitutePlayer();

  // Set selected season to active season when it loads
  useEffect(() => {
    if (activeSeason && !selectedSeasonId) {
      setSelectedSeasonId(activeSeason.season_id.toString());
    }
  }, [activeSeason, selectedSeasonId]);

  const handleValidatePlayer = async () => {
    setSuccess(null);
    setApiError(null);

    try {
      await validatePlayer(steamId, selectedSeasonId);
      // Success case - validationResult will be updated by the hook
    } catch (err) {
      // Error case - the error will be handled by the PlayerValidationForm component
      // via the validationError prop from the hook
      console.error("Validation failed:", err);
    }
  };

  const handleSeasonChange = (value: string) => {
    setSelectedSeasonId(value);
    // Clear team selection and results when season changes
    setSelectedTeamId("");
    clearValidationResults();
    setSuccess(null);
    setApiError(null);
  };

  const handleSteamIdChange = (value: string) => {
    setSteamId(value);
    // Clear results when steam ID changes - but only if the value actually changed
    if (value !== steamId) {
      clearValidationResults();
      setSuccess(null);
      setApiError(null);
    }
  };

  const handleTeamChange = (value: string) => {
    setSelectedTeamId(value);
    setSuccess(null);
    setApiError(null);
  };

  const handleMatchIdChange = (value: string) => {
    setMatchId(value);
    setSuccess(null);
    setApiError(null);
  };

  const handleAddSubstitutePlayer = async () => {
    if (!selectedSeasonId || !selectedTeamId || !steamId) {
      return;
    }

    setIsAdding(true);
    setSuccess(null);
    setApiError(null);

    try {
      // Convert Steam ID to SteamID64 format before adding
      const convertedSteamId = await convertSteamIdToSteamId64(steamId);

      // Send the match ID as-is to the backend for resolution
      // Backend will handle numeric IDs, Faceit room IDs, and Faceit URLs
      const matchIdValue = matchId.trim() || undefined;

      await addSubstitutePlayer({
        seasonId: selectedSeasonId,
        teamId: selectedTeamId,
        steamId: convertedSteamId,
        matchId: matchIdValue
      });

      const selectedTeam = teams?.find(
        (team) => team.team_id.toString() === selectedTeamId
      );
      const matchText = matchIdValue
        ? ` for match ${matchIdValue}`
        : " for the whole season";

      setSuccess(
        `Substitute player successfully added to ${selectedTeam?.team_name || "the team"}${matchText}`
      );

      // Clear validation results after successful addition
      clearValidationResults();
      setSteamId("");
      setMatchId("");
    } catch (err) {
      console.error("Failed to add substitute player:", err);
      setSuccess(null);

      // Handle API errors with RFC 7807 format
      if (err instanceof ApiError) {
        setApiError(err.detail || err.message);
      } else if (err instanceof Error) {
        setApiError(err.message);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const error = err as any;
        if (error?.detail) {
          setApiError(error.detail);
        } else if (error?.message) {
          setApiError(error.message);
        } else {
          setApiError(
            "An unexpected error occurred while adding the substitute player"
          );
        }
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <div className="flex flex-1 flex-col gap-6 p-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Add Substitute Player
          </h1>
          <p className="text-muted-foreground">
            Add a substitute player to a team. Only player validation is
            required - no team balance checking.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Substitute Player Addition</CardTitle>
              <CardDescription>
                Select a season, validate the player, choose a team and
                optionally set a match ID
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

              {/* Match ID Input */}
              <div className="space-y-2">
                <Label htmlFor="matchId">
                  Match ID (optional)
                  <span className="text-sm text-muted-foreground ml-2">
                    Leave empty to add for whole season
                  </span>
                </Label>
                <Input
                  id="matchId"
                  placeholder="Enter match ID, Faceit room ID, or Faceit URL"
                  value={matchId}
                  onChange={(e) => handleMatchIdChange(e.target.value)}
                  data-testid="match-id-input"
                />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Supported formats:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>
                      Numeric match ID: <code>123</code>
                    </li>
                    <li>
                      Faceit room ID:{" "}
                      <code>1-ff5e99c3-0765-4173-ba2a-398987b1b3ef</code>
                    </li>
                    <li>
                      Faceit URL:{" "}
                      <code>
                        https://www.faceit.com/en/cs2/room/1-abc123-def456
                      </code>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Add Substitute Player Button */}
              <Button
                onClick={handleAddSubstitutePlayer}
                disabled={
                  !selectedSeasonId ||
                  !selectedTeamId ||
                  !steamId ||
                  isAdding ||
                  !validationResult ||
                  !validationResult.overall_success
                }
                className="w-full"
                data-testid="add-substitute-player-button"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Substitute...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    2. Add Substitute Player
                  </>
                )}
              </Button>

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

              {/* Error Message */}
              {apiError && (
                <Alert variant="destructive" data-testid="error-message">
                  <AlertDescription>{apiError}</AlertDescription>
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
        </div>
      </div>
    </WithRoleProtection>
  );
}
