"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { FantasyTeamStatCard } from "./FantasyTeamStatCard";
import { FantasyTeamPlayerCard } from "./FantasyTeamPlayerCard";
import SubstitutionDialog from "./SubstitutionDialog";
import RoleAssignmentDialog, { type PlayerRole } from "./RoleAssignmentDialog";
import PlayerPointHistory from "./PlayerPointHistory";
import type { MyFantasyTeam } from "@/hooks/data/useMyFantasyTeam";
import type { FantasyPlayer } from "./FantasyLeague";

type FantasyTeamViewProps = {
  existingTeam: MyFantasyTeam;
  seasonId: string;
  userRank: number | null;
  totalTeams: number;
  roleChangesRemaining: number;
  substitutionsRemaining: number;
  fantasyPlayers: FantasyPlayer[];
  onRoleSelect: (
    playerId: string,
    role: PlayerRole | undefined
  ) => Promise<boolean>;
  onConfirmSubstitution: (
    newPlayerSteamId: string,
    newPlayerValue: number,
    role?: string,
    removePlayerId?: string
  ) => Promise<void>;
  isSubmitting: boolean;
};

export function FantasyTeamView({
  existingTeam,
  seasonId,
  userRank,
  totalTeams,
  roleChangesRemaining,
  substitutionsRemaining,
  fantasyPlayers,
  onRoleSelect,
  onConfirmSubstitution,
  isSubmitting
}: FantasyTeamViewProps) {
  const [showSubstitutionDialog, setShowSubstitutionDialog] = useState(false);
  const [playerToReplace, setPlayerToReplace] = useState<{
    steam_id: string;
    nickname: string;
    team_name: string;
    player_value: number;
  } | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [currentRolePlayerIndex, setCurrentRolePlayerIndex] = useState(0);
  const [selectedPlayerForPoints, setSelectedPlayerForPoints] = useState<
    MyFantasyTeam["players"][number] | null
  >(null);

  const handleSubstitutePlayer = useCallback(
    (player: MyFantasyTeam["players"][number]) => {
      setPlayerToReplace({
        steam_id: player.steam_id,
        nickname: player.nickname,
        team_name: player.team_name || "Free Agent",
        player_value: player.player_value
      });
      setShowSubstitutionDialog(true);
    },
    []
  );

  const handleConfirmSubstitutionWrapper = useCallback(
    async (newPlayerSteamId: string, newPlayerValue: number, role?: string) => {
      if (!playerToReplace) return;

      // Call the parent's handler with the player to replace ID
      await onConfirmSubstitution(
        newPlayerSteamId,
        newPlayerValue,
        role,
        playerToReplace.steam_id
      );

      // Close dialog and reset state
      setShowSubstitutionDialog(false);
      setPlayerToReplace(null);
    },
    [playerToReplace, onConfirmSubstitution]
  );

  const handleAssignRole = useCallback(
    (player: MyFantasyTeam["players"][number]) => {
      const playerIndex = existingTeam.players.findIndex(
        (p) => p.steam_id === player.steam_id
      );
      setCurrentRolePlayerIndex(playerIndex);
      setRoleDialogOpen(true);
    },
    [existingTeam]
  );

  return (
    <div className="space-y-6">
      {/* Existing Team View */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">
                {existingTeam.team_name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Your Fantasy Team
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  (window.location.href = `/seasons/${seasonId}/fantasy/top-players`)
                }
              >
                Top Players
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  (window.location.href = `/seasons/${seasonId}/fantasy/leaderboard`)
                }
              >
                View Leaderboard
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Team Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <FantasyTeamStatCard
              label="Total Points"
              value={existingTeam.total_points}
              icon={<Award className="h-3 w-3 text-muted-foreground" />}
            />
            <FantasyTeamStatCard
              label="Budget Remaining"
              value={`€${(existingTeam.budget_remaining / 1000).toFixed(0)}K`}
            />
            <FantasyTeamStatCard
              label="Players"
              value={`${existingTeam.players.length}/5`}
            />
            <FantasyTeamStatCard
              label="Rank"
              value={
                <>
                  {userRank !== null ? userRank : "-"}
                  {userRank !== null && totalTeams > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {" "}
                      / {totalTeams}
                    </span>
                  )}
                </>
              }
              icon={<TrendingUp className="h-3 w-3 text-muted-foreground" />}
            />
            <FantasyTeamStatCard
              label="Swaps & Subs"
              value={
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-lg font-black text-white">
                      {roleChangesRemaining}
                      <span className="text-xs text-muted-foreground font-normal">
                        {" "}
                        / 2
                      </span>
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Role Swaps
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 border-t border-white/10 pt-4">
                    <p className="text-lg font-black text-white">
                      {substitutionsRemaining}
                      <span className="text-xs text-muted-foreground font-normal">
                        {" "}
                        / 2
                      </span>
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Substitutions
                    </p>
                  </div>
                </div>
              }
              icon={
                <RefreshCw
                  className={cn(
                    "h-3 w-3",
                    roleChangesRemaining > 0 && substitutionsRemaining > 0
                      ? "text-green-400"
                      : "text-red-400"
                  )}
                />
              }
              variant={
                roleChangesRemaining > 0 && substitutionsRemaining > 0
                  ? "success"
                  : "danger"
              }
              subtitle="This Week"
            />
          </div>

          {/* Team Players */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Your Team
              <Badge variant="outline">{existingTeam.players.length}/5</Badge>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...existingTeam.players]
                .sort((a, b) =>
                  String(a.steam_id).localeCompare(String(b.steam_id))
                )
                .map((player) => (
                  <FantasyTeamPlayerCard
                    key={player.steam_id}
                    player={player}
                    existingTeam={existingTeam}
                    roleChangesRemaining={roleChangesRemaining}
                    substitutionsRemaining={substitutionsRemaining}
                    onAssignRole={() => handleAssignRole(player)}
                    onSubstitute={() => handleSubstitutePlayer(player)}
                    onViewPoints={() => setSelectedPlayerForPoints(player)}
                  />
                ))}
            </div>
          </div>

          {/* Substitution Info */}
          <div className="p-4 bg-blue-950/30 border border-blue-900/50 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>Substitutions:</strong> You have {substitutionsRemaining}{" "}
              substitution(s) remaining this week. You can substitute players to
              optimize your team performance.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Substitution Dialog */}
      <SubstitutionDialog
        open={showSubstitutionDialog}
        onOpenChange={setShowSubstitutionDialog}
        playerToReplace={
          playerToReplace
            ? {
                player_id: playerToReplace.steam_id,
                nickname: playerToReplace.nickname,
                team_name: playerToReplace.team_name || "Free Agent",
                player_value: playerToReplace.player_value
              }
            : null
        }
        availablePlayers={fantasyPlayers}
        existingTeamPlayerIds={existingTeam.players.map((p) => p.steam_id)}
        existingTeamRoles={existingTeam.players.map((p) => ({
          steam_id: p.steam_id,
          role: p.role
        }))}
        currentBudget={existingTeam.budget_remaining}
        substitutionsRemaining={substitutionsRemaining}
        onConfirmSubstitution={handleConfirmSubstitutionWrapper}
        isSubmitting={isSubmitting}
      />

      {/* Role Assignment Dialog */}
      <RoleAssignmentDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        players={existingTeam.players.map((p) => ({
          id: p.steam_id,
          name: p.nickname,
          team: p.team_name || "Free Agent",
          role: p.role || undefined
        }))}
        currentPlayerIndex={currentRolePlayerIndex}
        onRoleSelect={onRoleSelect}
        onNavigate={(direction) => {
          if (direction === "next") {
            setCurrentRolePlayerIndex(
              Math.min(
                currentRolePlayerIndex + 1,
                existingTeam.players.length - 1
              )
            );
          } else {
            setCurrentRolePlayerIndex(Math.max(currentRolePlayerIndex - 1, 0));
          }
        }}
        autoAdvance={true}
        assignedRoles={existingTeam.players
          .filter((p) => p.role !== null)
          .map((p) => p.role as string)}
      />

      {/* Player Point History Dialog */}
      {selectedPlayerForPoints && (
        <PlayerPointHistory
          open={selectedPlayerForPoints !== null}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedPlayerForPoints(null);
            }
          }}
          playerId={selectedPlayerForPoints.steam_id}
          playerName={selectedPlayerForPoints.nickname}
          seasonId={seasonId}
        />
      )}
    </div>
  );
}
