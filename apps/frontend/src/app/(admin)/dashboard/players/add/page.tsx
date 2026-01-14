"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle, XCircle, Users } from "lucide-react";
import { extractErrorMessage } from "@/lib/apiClient";

import { useDashboardSeason } from "@/hooks/data/dashboard/useDashboardSeason";
import { useDashboardSeasonTeams } from "@/hooks/data/useDashboardSeasonTeams";
import { usePlayerTeamEligibility } from "@/hooks/data/usePlayerTeamEligibility";
import { usePlayerValidation } from "@/hooks/data/dashboard/usePlayerValidation";
import { useAddPlayer } from "@/hooks/data/useAddPlayer";
import { PlayerValidationDisplay } from "@/components/dashboard/PlayerValidationDisplay";
import { PlayerValidationForm } from "@/components/dashboard/PlayerValidationForm";
import { convertSteamIdToSteamId64 } from "@/lib/utils";
import { LiveTeamPlayersPopup } from "@/components/dashboard/LiveTeamPlayersPopup";
import { useTeamPlayersLive } from "@/hooks/data/dashboard/useTeamPlayersLive";
import { SelectedSeasonBadge } from "@/components/dashboard/SelectedSeasonBadge";

export default function AddPlayerPage() {
  const { selectedSeasonId: sharedSeasonId } = useDashboardSeason();
  const [selectedContext, setSelectedContext] = useState<
    "finalized" | "registration"
  >("finalized");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [steamId, setSteamId] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [apiError, setApiError] = useState<React.ReactNode | null>(null);
  const [skipProfileValidation, setSkipProfileValidation] = useState(false);
  const [showRosterPopup, setShowRosterPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  // Use shared season for finalized context
  // For registration context, we still need a season - use shared season if available
  const effectiveSeasonId = sharedSeasonId || "";

  // Get teams for the selected season with context
  const { teams, isLoading: isLoadingTeams } = useDashboardSeasonTeams(
    effectiveSeasonId,
    selectedContext
  );

  // Get the selected team's tier
  const selectedTeam = teams?.find(
    (team) => team.team_id.toString() === selectedTeamId
  );
  const isTier1Team = selectedTeam?.tier === 1;

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
  } = usePlayerTeamEligibility(effectiveSeasonId, selectedTeamId, steamId);

  // Add player hook
  const { addPlayer } = useAddPlayer();

  // Live team roster hook - uses effective season
  const {
    players: liveTeamPlayers,
    isLoading: isLoadingLiveRoster,
    mutate: mutateLiveRoster
  } = useTeamPlayersLive(
    effectiveSeasonId ? Number(effectiveSeasonId) : null,
    selectedTeamId ? Number(selectedTeamId) : null
  );

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
      await validatePlayer(steamId, effectiveSeasonId);
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
    // Check if this is a registration context selection
    if (value.startsWith("registration-")) {
      setSelectedContext("registration");
    } else {
      setSelectedContext("finalized");
    }
    // Clear team selection and results when season changes
    setSelectedTeamId("");
    clearValidationResults();
    clearResult();
    setSuccess(null);
    setApiError(null);
    setSkipProfileValidation(false);
  };

  // Reset selections when shared season changes
  useEffect(() => {
    if (sharedSeasonId && selectedContext === "finalized") {
      setSelectedTeamId("");
      clearValidationResults();
      clearResult();
      setSuccess(null);
      setApiError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedSeasonId, selectedContext]);

  const handleSteamIdChange = (value: string) => {
    setSteamId(value);
    // Clear results when steam ID changes - but only if the value actually changed
    if (value !== steamId) {
      clearValidationResults();
      clearResult();
      setSuccess(null);
      setApiError(null);
      setSkipProfileValidation(false);
    }
  };

  const handleTeamChange = (value: string) => {
    setSelectedTeamId(value);
    // Clear results when team changes
    clearResult();
    setSuccess(null);
    setApiError(null);
  };

  const handleAddPlayer = async () => {
    if (!effectiveSeasonId || !selectedTeamId) {
      return;
    }

    // Profile validation must be successful before adding player
    if (!validationResult || !validationResult.profile.success) {
      setApiError(
        <>
          Cannot add player: Profile validation is required. Please ensure the
          player has a verified Kanahub profile.{" "}
          <Link
            href="/dashboard/players/prepare-for-signup"
            className="underline text-kanaliiga-orange font-medium text-kanaliiga-orange hover:text-orange-600"
          >
            Prepare player profile
          </Link>
        </>
      );
      return;
    }

    // For registration context, skip eligibility checks
    // For tier 1 teams, we can add without eligibility check
    // For other finalized teams, we need eligibility result
    if (selectedContext === "finalized" && !isTier1Team && !eligibilityResult) {
      return;
    }

    setIsAdding(true);
    setSuccess(null);
    setApiError(null);

    try {
      // Convert Steam ID to SteamID64 format before adding
      const convertedSteamId = await convertSteamIdToSteamId64(steamId);

      // Use eligibility result data if available, otherwise use default/empty values
      // The backend will fetch the actual kana_elo internally
      const kanaElo = eligibilityResult?.selectedTeam.new_player_kana_elo ?? 0;
      const calculus =
        eligibilityResult?.selectedTeam.csrankker_components || {};

      await addPlayer(
        effectiveSeasonId,
        selectedTeamId,
        convertedSteamId,
        {
          kana_elo: kanaElo,
          calculus
        },
        selectedContext
      );

      const teamName =
        eligibilityResult?.selectedTeam.team_name ||
        selectedTeam?.team_name ||
        "team";

      const contextMessage =
        selectedContext === "registration" ? "registration" : "team";
      setSuccess(`Player successfully added to ${teamName} ${contextMessage}`);

      // Clear validation and eligibility check results after successful addition
      clearValidationResults();
      clearResult();
      setSteamId("");
    } catch (err) {
      console.error("Failed to add player:", err);
      setSuccess(null);

      // Handle API errors with RFC 7807 format
      setApiError(
        extractErrorMessage(
          err,
          "An unexpected error occurred while adding the player"
        )
      );
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <div className="flex flex-1 flex-col gap-6 p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Add Player</h1>
            <SelectedSeasonBadge />
          </div>
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
              {/* Context Selection */}
              <div className="space-y-2">
                <Label htmlFor="context">Context</Label>
                <Select
                  value={selectedContext}
                  onValueChange={(value: "finalized" | "registration") => {
                    setSelectedContext(value);
                    setSelectedTeamId("");
                    clearValidationResults();
                    clearResult();
                    setSuccess(null);
                    setApiError(null);
                  }}
                >
                  <SelectTrigger id="context">
                    <SelectValue placeholder="Select context" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finalized">Finalized Season</SelectItem>
                    <SelectItem value="registration">Registration</SelectItem>
                  </SelectContent>
                </Select>
                {!sharedSeasonId && (
                  <p className="text-sm text-muted-foreground">
                    Please select a season from the sidebar to continue.
                  </p>
                )}
              </div>

              {/* Player Validation Form */}
              <PlayerValidationForm
                steamId={steamId}
                setSteamId={handleSteamIdChange}
                seasonId={
                  selectedContext === "registration"
                    ? `registration-${effectiveSeasonId}`
                    : effectiveSeasonId
                }
                setSeasonId={handleSeasonChange}
                seasons={[]}
                isLoadingSeasons={false}
                isValidating={isValidating}
                error={validationError}
                onValidate={handleValidatePlayer}
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

                {/* View Team Roster Button */}
                {selectedTeamId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setPopupPosition({
                        x: rect.left,
                        y: rect.bottom + 10
                      });
                      setShowRosterPopup(true);
                      mutateLiveRoster();
                    }}
                    className="w-full mt-2"
                    data-testid="view-roster-button"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    View Current Team Roster
                  </Button>
                )}
              </div>

              {/* Skip Profile Validation Checkbox - Show when profile validation fails but ranks/hours are present */}
              {!isTier1Team &&
                validationResult &&
                !validationResult.overall_success &&
                validationResult.hours.success &&
                validationResult.rank.success &&
                validationResult.platform_rank.success &&
                !validationResult.profile.success && (
                  <div className="flex items-center space-x-2 rounded-md border p-3">
                    <Checkbox
                      id="skip-profile-validation"
                      checked={skipProfileValidation}
                      onCheckedChange={(checked) =>
                        setSkipProfileValidation(checked === true)
                      }
                      data-testid="skip-profile-validation-checkbox"
                    />
                    <Label
                      htmlFor="skip-profile-validation"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Skip profile validation (ranks and hours are sufficient
                      for eligibility check)
                    </Label>
                  </div>
                )}

              {/* Check Eligibility Button - Hidden for tier 1 teams and registration context */}
              {selectedContext === "finalized" && !isTier1Team && (
                <Button
                  onClick={handleCheckEligibility}
                  disabled={
                    !effectiveSeasonId ||
                    !selectedTeamId ||
                    !steamId ||
                    isChecking ||
                    !validationResult ||
                    (!validationResult.overall_success &&
                      !(
                        skipProfileValidation &&
                        validationResult.hours.success &&
                        validationResult.rank.success &&
                        validationResult.platform_rank.success
                      ))
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
              )}

              {/* For registration context, show info that eligibility check is skipped */}
              {selectedContext === "registration" &&
                validationResult?.overall_success && (
                  <Alert
                    variant="default"
                    className="border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    data-testid="registration-info"
                  >
                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                      Registration context: Eligibility check skipped. You can
                      add the player directly to the registration.
                    </AlertDescription>
                  </Alert>
                )}

              {/* For tier 1 teams, show info that eligibility check is skipped */}
              {selectedContext === "finalized" &&
                isTier1Team &&
                validationResult?.overall_success && (
                  <Alert
                    variant="default"
                    className="border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    data-testid="tier1-info"
                  >
                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                      Tier 1 league: Eligibility check skipped. You can add the
                      player directly.
                    </AlertDescription>
                  </Alert>
                )}

              {/* Show info when profile validation is skipped */}
              {!isTier1Team &&
                skipProfileValidation &&
                validationResult &&
                !validationResult.profile.success && (
                  <Alert
                    variant="default"
                    className="border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    data-testid="skip-profile-info"
                  >
                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                      Profile validation skipped. Eligibility check can proceed
                      with rank data only.
                    </AlertDescription>
                  </Alert>
                )}

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

              {/* API Error Display */}
              {apiError && (
                <Alert
                  variant="destructive"
                  data-testid="add-player-error-message"
                >
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{apiError}</AlertDescription>
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

          {/* Eligibility Results Display - Hidden for tier 1 teams */}
          {eligibilityResult && !isTier1Team && (
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
                      <span>Current Top 4 Average:</span>
                      <span className="font-mono">
                        {eligibilityResult.selectedTeam.current_top4_avg}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Top 5 Average:</span>
                      <span className="font-mono">
                        {eligibilityResult.selectedTeam.current_top5_avg}
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
                          Avg5: {team.avg5}
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
                      ? `The new average (${eligibilityResult.selectedTeam.new_avg_with_player}) is lower than or equal to the top team's average (${eligibilityResult.topTeamsInLeague[0]?.avg5}), so the player can be added.`
                      : `The new average (${eligibilityResult.selectedTeam.new_avg_with_player}) is higher than the top team's average (${eligibilityResult.topTeamsInLeague[0]?.avg5}), so the player cannot be added.`}
                  </AlertDescription>
                </Alert>

                {/* Add Player Button */}
                {eligibilityResult.canAddPlayer &&
                  validationResult &&
                  validationResult.profile.success && (
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

                {/* Show warning if profile validation failed */}
                {eligibilityResult.canAddPlayer &&
                  validationResult &&
                  !validationResult.profile.success && (
                    <Alert
                      variant="destructive"
                      data-testid="profile-validation-warning"
                    >
                      <AlertDescription>
                        Cannot add player: Profile validation is required. The
                        player must have a verified Kanahub profile before being
                        added to a team.{" "}
                        <Link
                          href="/dashboard/players/prepare-for-signup"
                          className="underline text-kanaliiga-orange font-medium hover:text-primary"
                        >
                          Prepare player profile
                        </Link>
                      </AlertDescription>
                    </Alert>
                  )}
              </CardContent>
            </Card>
          )}

          {/* Add Player Button for Tier 1 Teams - Show directly after validation */}
          {isTier1Team &&
            validationResult &&
            validationResult.overall_success &&
            validationResult.profile.success &&
            selectedTeamId &&
            !eligibilityResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Ready to Add Player
                  </CardTitle>
                  <CardDescription>
                    Tier 1 league: Eligibility check not required
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleAddPlayer}
                    disabled={isAdding}
                    className="w-full"
                    variant="default"
                    data-testid="add-player-button-tier1"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Player...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        2. Add Player to Team
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

          {/* Show warning for tier 1 teams if profile validation failed */}
          {isTier1Team &&
            validationResult &&
            validationResult.overall_success &&
            !validationResult.profile.success &&
            selectedTeamId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    Cannot Add Player
                  </CardTitle>
                  <CardDescription>
                    Profile validation is required
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert variant="destructive">
                    <AlertDescription>
                      Cannot add player: Profile validation is required. The
                      player must have a verified Kanahub profile before being
                      added to a team.{" "}
                      <Link
                        href="/dashboard/players/prepare-for-signup"
                        className="underline text-kanaliiga-orange font-medium hover:text-primary"
                      >
                        Prepare player profile
                      </Link>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

          {/* Add Player Button for Registration Context - Show directly after validation */}
          {selectedContext === "registration" &&
            validationResult &&
            validationResult.overall_success &&
            validationResult.profile.success &&
            selectedTeamId &&
            !eligibilityResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Ready to Add Player to Registration
                  </CardTitle>
                  <CardDescription>
                    Registration context: Eligibility check not required
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleAddPlayer}
                    disabled={isAdding}
                    className="w-full"
                    variant="default"
                    data-testid="add-player-button-registration"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Player...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        2. Add Player to Registration
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

          {/* Show warning for registration context if profile validation failed */}
          {selectedContext === "registration" &&
            validationResult &&
            validationResult.overall_success &&
            !validationResult.profile.success &&
            selectedTeamId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    Cannot Add Player
                  </CardTitle>
                  <CardDescription>
                    Profile validation is required
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert variant="destructive">
                    <AlertDescription>
                      Cannot add player: Profile validation is required. The
                      player must have a verified Kanahub profile before being
                      added to the registration.{" "}
                      <Link
                        href="/dashboard/players/prepare-for-signup"
                        className="underline text-kanaliiga-orange font-medium hover:text-primary"
                      >
                        Prepare player profile
                      </Link>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
        </div>
      </div>

      {/* Live Team Roster Popup */}
      {showRosterPopup &&
        selectedTeamId &&
        selectedTeam &&
        effectiveSeasonId && (
          <LiveTeamPlayersPopup
            players={liveTeamPlayers || []}
            teamName={selectedTeam.team_name}
            seasonName={`Season ${effectiveSeasonId}`}
            position={popupPosition}
            isLoading={isLoadingLiveRoster}
            onClose={() => setShowRosterPopup(false)}
          />
        )}
    </WithRoleProtection>
  );
}
