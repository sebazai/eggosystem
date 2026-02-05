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
import {
  Loader2,
  CheckCircle,
  Users,
  XCircle,
  AlertTriangle
} from "lucide-react";

import { useDashboardSeason } from "@/hooks/data/dashboard/useDashboardSeason";
import { useAllSeasons } from "@/hooks/data/dashboard/useAllSeasons";
import { SelectedSeasonBadge } from "@/components/dashboard/SelectedSeasonBadge";
import { useDashboardSeasonTeams } from "@/hooks/data/useDashboardSeasonTeams";
import { usePlayerValidation } from "@/hooks/data/dashboard/usePlayerValidation";
import { useAddSubstitutePlayer } from "@/hooks/data/useAddSubstitutePlayer";
import { usePlayerTeamEligibility } from "@/hooks/data/usePlayerTeamEligibility";
import { PlayerValidationDisplay } from "@/components/dashboard/PlayerValidationDisplay";
import { PlayerValidationForm } from "@/components/dashboard/PlayerValidationForm";
import { convertSteamIdToSteamId64 } from "@/lib/utils";
import { ApiError } from "@/lib/apiClient";
import { LiveTeamPlayersPopup } from "@/components/dashboard/LiveTeamPlayersPopup";
import { useTeamPlayersLive } from "@/hooks/data/dashboard/useTeamPlayersLive";
import { Checkbox } from "@/components/ui/checkbox";

export default function AddSubstitutePlayerPage() {
  const { selectedSeasonId } = useDashboardSeason();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [steamId, setSteamId] = useState<string>("");
  const [matchId, setMatchId] = useState<string>("");
  const [replacingSteamId, setReplacingSteamId] = useState<string>("");
  const [checkEligibility, setCheckEligibility] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showRosterPopup, setShowRosterPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  // Get all seasons to find platform
  const { seasons } = useAllSeasons();

  // Use selected season from sidebar
  const effectiveSeasonId = selectedSeasonId || "";

  // Get platform from selected season
  const selectedSeason = selectedSeasonId
    ? seasons?.find((s) => s.id.toString() === selectedSeasonId)
    : null;
  const platform = selectedSeason?.platform ?? null;

  // Get teams for the selected season
  const { teams, isLoading: isLoadingTeams } = useDashboardSeasonTeams(
    selectedSeasonId || null
  );

  // Get the selected team
  const selectedTeam = teams?.find(
    (team) => team.team_id.toString() === selectedTeamId
  );

  // Live team roster hook - uses selected season
  const seasonIdForRoster = selectedSeasonId ? Number(selectedSeasonId) : null;
  const {
    players: liveTeamPlayers,
    isLoading: isLoadingLiveRoster,
    mutate: mutateLiveRoster
  } = useTeamPlayersLive(
    seasonIdForRoster,
    selectedTeamId ? Number(selectedTeamId) : null
  );

  // Get player eligibility check with optional exclusion
  const {
    eligibilityResult,
    isLoading: isCheckingEligibility,
    isError: eligibilityError,
    checkEligibility: performEligibilityCheck,
    clearResult: clearEligibilityResult
  } = usePlayerTeamEligibility(
    effectiveSeasonId,
    selectedTeamId,
    steamId,
    replacingSteamId
  );

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

  const handleValidatePlayer = async () => {
    setSuccess(null);
    setApiError(null);

    try {
      await validatePlayer(steamId, effectiveSeasonId);
    } catch (err) {
      console.error("Validation failed:", err);
    }
  };

  // Reset team selection when season changes (but don't clear validation if season hasn't actually changed)
  useEffect(() => {
    // Only clear if we have a selectedSeasonId (meaning user changed it, not initial mount)
    if (selectedSeasonId !== null && selectedSeasonId !== undefined) {
      setSelectedTeamId("");
      setReplacingSteamId("");
      clearValidationResults();
      clearEligibilityResult();
      setSuccess(null);
      setApiError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeasonId]);

  const handleSteamIdChange = (value: string) => {
    setSteamId(value);
    // Clear results when steam ID changes - but only if the value actually changed
    if (value !== steamId) {
      clearValidationResults();
      clearEligibilityResult();
      setSuccess(null);
      setApiError(null);
    }
  };

  const handleTeamChange = (value: string) => {
    setSelectedTeamId(value);
    setReplacingSteamId("");
    clearEligibilityResult();
    setSuccess(null);
    setApiError(null);
  };

  const handleMatchIdChange = (value: string) => {
    setMatchId(value);
    setSuccess(null);
    setApiError(null);
  };

  const handleReplacingPlayerChange = (value: string) => {
    setReplacingSteamId(value);
    clearEligibilityResult();
    setSuccess(null);
    setApiError(null);
  };

  const handleCheckEligibilityClick = async () => {
    if (!effectiveSeasonId || !selectedTeamId || !steamId) {
      return;
    }

    try {
      await performEligibilityCheck();
    } catch (err) {
      console.error("Eligibility check failed:", err);
    }
  };

  const handleAddSubstitutePlayer = async () => {
    if (!effectiveSeasonId || !selectedTeamId || !steamId) {
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
      const matchIdValue = matchId.trim();

      await addSubstitutePlayer({
        seasonId: effectiveSeasonId,
        teamId: selectedTeamId,
        steamId: convertedSteamId,
        matchId: matchIdValue,
        replacesSteamId: replacingSteamId || undefined,
        ticketNumber: ticketNumber.trim()
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
      clearEligibilityResult();
      setSteamId("");
      setMatchId("");
      setTicketNumber("");
      setReplacingSteamId("");
      setCheckEligibility(false);
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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">
              Add Substitute Player
            </h1>
            <SelectedSeasonBadge />
          </div>
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
                Select a season, validate the player, choose a team and set a
                match ID
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Season Selection Message */}
              {!selectedSeasonId && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Please select a season from the sidebar to continue.
                  </AlertDescription>
                </Alert>
              )}
              {/* Player Validation Form */}
              <PlayerValidationForm
                steamId={steamId}
                setSteamId={handleSteamIdChange}
                seasonId={effectiveSeasonId}
                isValidating={isValidating}
                error={validationError}
                onValidate={handleValidatePlayer}
                buttonText="1. Validate Player"
                data-testid="validate-player-button"
              />

              {/* Team Selector */}
              {selectedSeasonId && (
                <div className="space-y-2">
                  <Label htmlFor="team">Team</Label>
                  <Select
                    value={selectedTeamId}
                    onValueChange={handleTeamChange}
                    data-testid="team-select"
                    disabled={!selectedSeasonId || isLoadingTeams}
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
              )}

              {!selectedSeasonId && (
                <div className="text-sm text-muted-foreground py-2">
                  Please select a season from the sidebar to see available
                  teams.
                </div>
              )}

              {selectedTeamId && validationResult?.overall_success && (
                <div className="flex items-center space-x-2 rounded-md border p-3">
                  <Checkbox
                    id="check-eligibility"
                    checked={checkEligibility}
                    onCheckedChange={(checked) => {
                      setCheckEligibility(checked === true);
                      if (!checked) {
                        setReplacingSteamId("");
                        clearEligibilityResult();
                      }
                    }}
                    data-testid="check-eligibility-checkbox"
                  />
                  <Label
                    htmlFor="check-eligibility"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Check team eligibility (for substitutes that might affect
                    balance)
                  </Label>
                </div>
              )}

              {/* Player Selection for Substitution */}
              {checkEligibility && liveTeamPlayers && (
                <div className="space-y-2">
                  <Label htmlFor="replacing-player">
                    Who will this substitute replace? (Optional)
                  </Label>
                  <Select
                    value={replacingSteamId || "none"}
                    onValueChange={(value) =>
                      handleReplacingPlayerChange(value === "none" ? "" : value)
                    }
                    data-testid="replacing-player-select"
                  >
                    <SelectTrigger data-testid="replacing-player-selector">
                      <SelectValue placeholder="Select player to replace" />
                    </SelectTrigger>
                    <SelectContent data-testid="replacing-player-dropdown">
                      <SelectItem
                        value="none"
                        data-testid="no-replacement-option"
                      >
                        No specific replacement
                      </SelectItem>
                      {liveTeamPlayers
                        .filter((p) => p.role === "primary")
                        .map((player) => (
                          <SelectItem
                            key={player.steamid}
                            value={player.steamid}
                            data-testid={`replacing-player-option-${player.steamid}`}
                          >
                            {player.name} (Kana ELO: {player.kana_elo})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Selecting a player will exclude them from eligibility
                    calculations, simulating the team balance with the
                    substitute instead.
                  </p>
                </div>
              )}

              {/* Check Eligibility Button */}
              {checkEligibility && (
                <Button
                  onClick={handleCheckEligibilityClick}
                  disabled={
                    !selectedSeasonId ||
                    !selectedTeamId ||
                    !steamId ||
                    isCheckingEligibility ||
                    !validationResult ||
                    !validationResult.overall_success
                  }
                  className="w-full"
                  variant="secondary"
                  data-testid="check-eligibility-button"
                >
                  {isCheckingEligibility ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    "Check Team Eligibility"
                  )}
                </Button>
              )}

              {/* Match ID Input */}
              <div className="space-y-2">
                <Label htmlFor="matchId">
                  Match ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="matchId"
                  placeholder="Enter match ID, Faceit room ID, or Faceit URL"
                  value={matchId}
                  onChange={(e) => handleMatchIdChange(e.target.value)}
                  data-testid="match-id-input"
                  required
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

              {/* Ticket Number Input */}
              <div className="space-y-2">
                <Label htmlFor="ticketNumber">
                  Helpdesk Ticket Number{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ticketNumber"
                  placeholder="e.g., HD-12345 or ticket reference"
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  data-testid="ticket-number-input"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Required for audit trail. Enter the helpdesk ticket number or
                  reference.
                </p>
              </div>

              {/* Eligibility Error Display */}
              {eligibilityError && checkEligibility && (
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

              {/* Add Substitute Player Button */}
              <Button
                onClick={handleAddSubstitutePlayer}
                disabled={
                  !selectedSeasonId ||
                  !selectedTeamId ||
                  !steamId ||
                  isAdding ||
                  !validationResult ||
                  !matchId.trim() ||
                  !ticketNumber.trim() ||
                  // If checking eligibility, must have result and it must allow adding
                  (checkEligibility && !eligibilityResult) ||
                  (checkEligibility &&
                    eligibilityResult &&
                    !eligibilityResult.canAddPlayer) ||
                  // If not checking eligibility, basic validation must pass
                  (!checkEligibility && !validationResult.overall_success)
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
                    {checkEligibility
                      ? "3. Add Substitute Player"
                      : "2. Add Substitute Player"}
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
            <div className="lg:col-span-2">
              <PlayerValidationDisplay
                validationResult={validationResult}
                platform={platform}
                variant="compact"
              />
            </div>
          )}

          {/* Eligibility Results Display */}
          {checkEligibility && eligibilityResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
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
                  {replacingSteamId
                    ? "Eligibility check with player replacement"
                    : "Eligibility check without replacement"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h3 className="font-semibold">
                    {eligibilityResult.selectedTeam.team_name}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Current Top 4 Avg:</div>
                    <div className="font-mono">
                      {eligibilityResult.selectedTeam.current_top4_avg}
                    </div>
                    <div>Current Top 5 Avg:</div>
                    <div className="font-mono">
                      {eligibilityResult.selectedTeam.current_top5_avg}
                    </div>
                    <div>New Player Kana ELO:</div>
                    <div className="font-mono">
                      {eligibilityResult.selectedTeam.new_player_kana_elo}
                    </div>
                    <div>New Avg with Player:</div>
                    <div className="font-mono font-bold">
                      {eligibilityResult.selectedTeam.new_avg_with_player}
                    </div>
                  </div>

                  {replacingSteamId && (
                    <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                      <AlertDescription className="text-blue-700 dark:text-blue-300">
                        Calculations exclude the selected player, showing the
                        team balance if they were substituted.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="pt-2">
                    <h4 className="font-semibold mb-2">
                      Top Teams in {eligibilityResult.league_name}
                    </h4>
                    <div className="space-y-1 text-sm">
                      {eligibilityResult.topTeamsInLeague.map((team, idx) => (
                        <div
                          key={team.team_id}
                          className="flex justify-between items-center"
                        >
                          <span>
                            #{idx + 1} {team.team_name}
                          </span>
                          <span className="font-mono">{team.avg5}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {eligibilityResult.canAddPlayer ? (
                    <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-700 dark:text-green-300">
                        Player can be added. New team average (
                        {eligibilityResult.selectedTeam.new_avg_with_player}) is
                        within acceptable range.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        Player cannot be added. New team average (
                        {eligibilityResult.selectedTeam.new_avg_with_player})
                        would exceed the top team&apos;s average (
                        {eligibilityResult.topTeamsInLeague[0]?.avg5}).
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Live Team Roster Popup */}
      {showRosterPopup && selectedTeamId && selectedTeam && selectedSeason && (
        <LiveTeamPlayersPopup
          players={liveTeamPlayers || []}
          teamName={selectedTeam.team_name}
          seasonName={selectedSeason.full_name}
          position={popupPosition}
          isLoading={isLoadingLiveRoster}
          onClose={() => setShowRosterPopup(false)}
        />
      )}
    </WithRoleProtection>
  );
}
