"use client";

import { useState } from "react";
import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { clientApiFetch } from "@/lib/apiClient";
import useSWR from "swr";

interface Team {
  team_id: number;
  team_name: string;
  league_name: string;
}

interface EligibilityResult {
  selectedTeam: {
    team_id: number;
    team_name: string;
    current_top3_avg: number;
    current_top4_avg: number; // Added top 4 average
    new_avg_with_player: number;
    new_player_kana_elo: number;
    csrankker_components?: {
      trueLevel: number;
      mm: number;
      hour: number;
      kana: number;
    };
  };
  topTeamsInLeague: Array<{
    team_id: number;
    team_name: string;
    avg4: number;
    rank: number;
  }>;
  canAddPlayer: boolean;
  league_name: string;
}

export default function AddPlayerPage() {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [steamId, setSteamId] = useState<string>("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [eligibilityResult, setEligibilityResult] =
    useState<EligibilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get active season (app_id 730 for CS)
  const { data: activeSeason } = useSWR<{ season_id: number }>(
    "/api/v1/organizers/1/app/730/seasons/active",
    clientApiFetch,
    { revalidateOnFocus: false }
  );

  // Get teams for the active season
  const { data: teams, isLoading: isLoadingTeams } = useSWR<Team[]>(
    activeSeason
      ? `/api/v1/dashboard/sortter/season/${activeSeason.season_id}/teams`
      : null,
    clientApiFetch,
    { revalidateOnFocus: false }
  );

  const handleCheckEligibility = async () => {
    if (!selectedTeamId || !steamId || !activeSeason) {
      setError("Please select a team and enter a Steam ID");
      return;
    }

    setIsChecking(true);
    setError(null);
    setEligibilityResult(null);

    try {
      const result = await clientApiFetch<EligibilityResult>(
        `/api/v1/dashboard/sortter/season/${activeSeason.season_id}/team/${selectedTeamId}/player/${steamId}/eligibility`
      );
      setEligibilityResult(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check eligibility"
      );
    } finally {
      setIsChecking(false);
    }
  };

  const handleSteamIdChange = (value: string) => {
    setSteamId(value);
    // Clear results when steam ID changes
    setEligibilityResult(null);
    setError(null);
    setSuccess(null);
  };

  const handleTeamChange = (value: string) => {
    setSelectedTeamId(value);
    // Clear results when team changes
    setEligibilityResult(null);
    setError(null);
    setSuccess(null);
  };

  const handleAddPlayer = async () => {
    if (!eligibilityResult || !activeSeason) {
      return;
    }

    setIsAdding(true);
    setError(null);
    setSuccess(null);

    try {
      await clientApiFetch(
        `/api/v1/dashboard/sortter/season/${activeSeason.season_id}/team/${selectedTeamId}/player/${steamId}/add`,
        {
          method: "POST",
          body: JSON.stringify({
            kana_elo: eligibilityResult.selectedTeam.new_player_kana_elo,
            calculus: eligibilityResult.selectedTeam.csrankker_components || {}
          })
        }
      );

      setSuccess(
        `Player successfully added to ${eligibilityResult.selectedTeam.team_name}`
      );

      // Clear eligibility check result after successful addition
      setEligibilityResult(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add player to team"
      );
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <WithRoleProtection>
      <div className="flex flex-1 flex-col gap-6 p-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Add Player</h1>
          <p className="text-muted-foreground">
            Check if a player can be added to a team based on kana_elo balance
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Player Addition Check</CardTitle>
              <CardDescription>
                Select a team and enter a Steam ID to check eligibility
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Season Display */}
              <div className="space-y-2">
                <Label>Active Season</Label>
                <div className="text-sm text-muted-foreground">
                  {activeSeason
                    ? `Season ${activeSeason.season_id}`
                    : "Loading..."}
                </div>
              </div>

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

              {/* Steam ID Input */}
              <div className="space-y-2">
                <Label htmlFor="steamId">Steam ID</Label>
                <Input
                  id="steamId"
                  type="text"
                  placeholder="Enter Steam ID"
                  value={steamId}
                  onChange={(e) => handleSteamIdChange(e.target.value)}
                  data-testid="steam-id-input"
                />
              </div>

              {/* Check Button */}
              <Button
                onClick={handleCheckEligibility}
                disabled={!selectedTeamId || !steamId || isChecking}
                className="w-full"
                data-testid="check-eligibility-button"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Check Eligibility"
                )}
              </Button>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive" data-testid="error-message">
                  <AlertDescription>{error}</AlertDescription>
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

          {/* Results Display */}
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
                        Add Player to Team
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
