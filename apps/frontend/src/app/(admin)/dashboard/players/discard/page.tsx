"use client";

import { useState } from "react";
import * as React from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useDashboardSeason } from "@/hooks/data/dashboard/useDashboardSeason";
import { useDashboardSeasonTeams } from "@/hooks/data/useDashboardSeasonTeams";
import { useTeamPlayersLive } from "@/hooks/data/dashboard/useTeamPlayersLive";
import { useDiscardPlayer } from "@/hooks/data/dashboard/useDiscardPlayer";
import { ApiError } from "@/lib/apiClient";
import { SelectedSeasonBadge } from "@/components/dashboard/SelectedSeasonBadge";

export default function DiscardPlayerPage() {
  const { selectedSeasonId } = useDashboardSeason();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedPlayerSteamId, setSelectedPlayerSteamId] =
    useState<string>("");
  const [ticketNumber, setTicketNumber] = useState<string>("");
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Get teams for the selected season
  const { teams, isLoading: isLoadingTeams } = useDashboardSeasonTeams(
    selectedSeasonId || "",
    "finalized"
  );

  // Get live team players (will automatically exclude discarded players)
  const {
    players: liveTeamPlayers,
    isLoading: isLoadingLiveRoster,
    mutate: mutateLiveRoster
  } = useTeamPlayersLive(
    selectedSeasonId ? Number(selectedSeasonId) : null,
    selectedTeamId ? Number(selectedTeamId) : null
  );

  // Discard player hook
  const { discardPlayer } = useDiscardPlayer();

  // Reset team and player selection when season changes
  const handleSeasonChange = () => {
    setSelectedTeamId("");
    setSelectedPlayerSteamId("");
    setTicketNumber("");
    setSuccess(null);
    setApiError(null);
  };

  // Effect to reset selections when season changes
  React.useEffect(() => {
    handleSeasonChange();
  }, [selectedSeasonId]);

  const handleTeamChange = (value: string) => {
    setSelectedTeamId(value);
    setSelectedPlayerSteamId("");
    setTicketNumber("");
    setSuccess(null);
    setApiError(null);
  };

  const handlePlayerChange = (value: string) => {
    setSelectedPlayerSteamId(value);
    setSuccess(null);
    setApiError(null);
  };

  const handleDiscardPlayer = async () => {
    if (!selectedSeasonId || !selectedTeamId || !selectedPlayerSteamId) {
      setApiError("Please select a season, team, and player");
      return;
    }

    // Confirm before discarding
    const confirmed = window.confirm(
      `Are you sure you want to discard this player from the team? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setIsDiscarding(true);
    setSuccess(null);
    setApiError(null);

    try {
      await discardPlayer(
        selectedSeasonId,
        selectedTeamId,
        selectedPlayerSteamId,
        ticketNumber
      );
      setSuccess("Player successfully discarded from the team");
      toast.success("Player discarded successfully");

      // Clear selection and refresh roster
      setSelectedPlayerSteamId("");
      setTicketNumber("");
      await mutateLiveRoster();
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError(error.message);
        toast.error(error.message);
      } else {
        const errorMessage = "Failed to discard player. Please try again.";
        setApiError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsDiscarding(false);
    }
  };

  const selectedPlayer = liveTeamPlayers?.find(
    (p) => p.steamid === selectedPlayerSteamId
  );

  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Discard Player from Team
              </CardTitle>
              <SelectedSeasonBadge />
            </div>
            <CardDescription>
              Soft delete a player from a team. Discarded players will be
              excluded from live rosters, demo validation, and FaceIT roster
              validation, but their historical stats will be preserved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Team Selection */}
            {selectedSeasonId ? (
              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <Select
                  value={selectedTeamId}
                  onValueChange={handleTeamChange}
                  disabled={isLoadingTeams || !selectedSeasonId}
                >
                  <SelectTrigger id="team">
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams?.map((team) => (
                      <SelectItem
                        key={team.team_id}
                        value={team.team_id.toString()}
                      >
                        {team.team_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Please select a season from the sidebar to continue.
              </div>
            )}

            {/* Player Selection */}
            {selectedTeamId && (
              <div className="space-y-2">
                <Label htmlFor="player">Player</Label>
                {isLoadingLiveRoster ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading players...
                  </div>
                ) : liveTeamPlayers && liveTeamPlayers.length > 0 ? (
                  <Select
                    value={selectedPlayerSteamId}
                    onValueChange={handlePlayerChange}
                    disabled={!selectedTeamId}
                  >
                    <SelectTrigger id="player">
                      <SelectValue placeholder="Select a player to discard" />
                    </SelectTrigger>
                    <SelectContent>
                      {liveTeamPlayers.map((player) => (
                        <SelectItem key={player.steamid} value={player.steamid}>
                          <div className="flex items-center gap-2">
                            <span>{player.name}</span>
                            {player.is_captain && (
                              <span className="text-xs text-muted-foreground">
                                (Captain)
                              </span>
                            )}
                            {player.is_co_captain && (
                              <span className="text-xs text-muted-foreground">
                                (Co-Captain)
                              </span>
                            )}
                            {player.role === "substitute" && (
                              <span className="text-xs text-muted-foreground">
                                (Substitute)
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No active players found for this team.
                  </div>
                )}
              </div>
            )}

            {/* Selected Player Info */}
            {selectedPlayerSteamId && (
              <div className="space-y-2">
                <Label htmlFor="discard-ticket-number">
                  Helpdesk ticket number (optional)
                </Label>
                <Input
                  id="discard-ticket-number"
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  placeholder="e.g. ticket ID from your helpdesk"
                  autoComplete="off"
                  data-testid="discard-ticket-number"
                />
                <p className="text-sm text-muted-foreground">
                  If provided, stored on the roster row for audit when the
                  player is discarded.
                </p>
              </div>
            )}

            {selectedPlayer && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Player Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold">Name:</span>{" "}
                      {selectedPlayer.name}
                    </div>
                    <div>
                      <span className="font-semibold">Steam ID:</span>{" "}
                      {selectedPlayer.steamid}
                    </div>
                    <div>
                      <span className="font-semibold">Role:</span>{" "}
                      {selectedPlayer.role === "primary"
                        ? "Primary"
                        : "Substitute"}
                    </div>
                    {selectedPlayer.is_captain && (
                      <div>
                        <span className="font-semibold">Captain:</span> Yes
                      </div>
                    )}
                    {selectedPlayer.is_co_captain && (
                      <div>
                        <span className="font-semibold">Co-Captain:</span> Yes
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Success Message */}
            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {apiError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            {/* Discard Button */}
            <Button
              onClick={handleDiscardPlayer}
              disabled={
                !selectedSeasonId ||
                !selectedTeamId ||
                !selectedPlayerSteamId ||
                isDiscarding ||
                isLoadingLiveRoster
              }
              variant="destructive"
              className="w-full"
            >
              {isDiscarding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Discarding...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Discard Player
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </WithRoleProtection>
  );
}
