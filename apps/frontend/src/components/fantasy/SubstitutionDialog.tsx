"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import FantasyPlayerFlipCard from "./FantasyPlayerFlipCard";
import RoleAssignmentDialog from "./RoleAssignmentDialog";
import type { FantasyPlayer } from "./FantasyLeague";

interface SubstitutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerToReplace: {
    player_id: string;
    nickname: string;
    team_name: string;
    player_value: number;
  } | null;
  availablePlayers: FantasyPlayer[];
  existingTeamPlayerIds?: string[];
  currentBudget: number;
  substitutionsRemaining: number;
  onConfirmSubstitution: (
    newPlayerId: string,
    newPlayerValue: number,
    role?: string
  ) => Promise<void>;
  isSubmitting: boolean;
  isLoadingPlayers?: boolean;
}

export default function SubstitutionDialog({
  open,
  onOpenChange,
  playerToReplace,
  availablePlayers,
  existingTeamPlayerIds,
  currentBudget,
  substitutionsRemaining,
  onConfirmSubstitution,
  isSubmitting,
  isLoadingPlayers = false
}: SubstitutionDialogProps) {
  const [selectedNewPlayer, setSelectedNewPlayer] =
    useState<FantasyPlayer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | undefined>(
    undefined
  );
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  // Calculate budget after selling current player
  const budgetAfterSale = playerToReplace
    ? currentBudget + playerToReplace.player_value
    : currentBudget;

  // Calculate new budget if substitution is made
  const newBudget = selectedNewPlayer
    ? budgetAfterSale - selectedNewPlayer.value
    : budgetAfterSale;

  // Filter players by: not on team, affordability, and search query
  const filteredPlayers = useMemo(() => {
    // Filter out players already on the team (if existingTeamPlayerIds is provided)
    // Also exclude the player being replaced
    let filtered = availablePlayers;
    if (existingTeamPlayerIds && existingTeamPlayerIds.length > 0) {
      filtered = availablePlayers.filter(
        (p) =>
          !existingTeamPlayerIds.includes(p.steam_id) &&
          p.steam_id !== playerToReplace?.player_id
      );
    } else if (playerToReplace) {
      // If no existingTeamPlayerIds provided, at least exclude the player being replaced
      filtered = availablePlayers.filter(
        (p) => p.steam_id !== playerToReplace.player_id
      );
    }

    // Filter by affordability
    filtered = filtered.filter((p) => p.value <= budgetAfterSale);

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.team.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => b.stats.rating - a.stats.rating);
  }, [availablePlayers, existingTeamPlayerIds, budgetAfterSale, searchQuery]);

  // Group players by team
  const playersByTeam = useMemo(() => {
    return filteredPlayers.reduce(
      (acc, player) => {
        if (!acc[player.team]) {
          acc[player.team] = [];
        }
        acc[player.team]!.push(player);
        return acc;
      },
      {} as Record<string, FantasyPlayer[]>
    );
  }, [filteredPlayers]);

  const teams = Object.keys(playersByTeam).sort();

  const handleConfirm = async () => {
    if (!selectedNewPlayer) return;

    try {
      await onConfirmSubstitution(
        selectedNewPlayer.steam_id,
        selectedNewPlayer.value,
        selectedRole
      );
      setSelectedNewPlayer(null);
      setSelectedRole(undefined);
      setSearchQuery("");
      onOpenChange(false);
    } catch (error) {
      console.error("Substitution failed:", error);
    }
  };

  const handleClose = () => {
    setSelectedNewPlayer(null);
    setSelectedRole(undefined);
    setSearchQuery("");
    onOpenChange(false);
  };

  const handlePlayerSelect = (player: FantasyPlayer) => {
    setSelectedNewPlayer(player);
    // If player already has a role, set it as default
    if (player.role) {
      setSelectedRole(player.role);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="!max-w-[1400px] w-[95vw] max-h-[90vh] h-[90vh] p-0 overflow-hidden sm:!max-w-[1400px]">
          <DialogHeader className="p-6 pb-4 border-b border-neutral-800">
            <DialogTitle className="text-2xl">Substitute Player</DialogTitle>
            <DialogDescription>
              Replace {playerToReplace?.nickname} with a new player. You have{" "}
              {substitutionsRemaining} substitution(s) remaining this week.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col h-[calc(90vh-180px)] overflow-hidden">
            {/* Budget Info - Always visible */}
            <div className="grid grid-cols-3 gap-4 p-4 mx-6 mt-4 bg-neutral-900 rounded-lg flex-shrink-0">
              <div>
                <p className="text-xs text-muted-foreground">Current Budget</p>
                <p className="text-lg font-bold">
                  €{(currentBudget / 1000).toFixed(0)}K
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">After Sale</p>
                <p className="text-lg font-bold text-green-400">
                  €{(budgetAfterSale / 1000).toFixed(0)}K
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  After Substitution
                </p>
                <p
                  className={cn(
                    "text-lg font-bold",
                    newBudget < 0 ? "text-red-400" : "text-blue-400"
                  )}
                >
                  €{(newBudget / 1000).toFixed(0)}K
                </p>
              </div>
            </div>

            {/* Selected Player Info */}
            {selectedNewPlayer && (
              <div className="mx-6 mt-4 p-4 bg-primary/10 border border-primary/30 rounded-lg flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">
                      Selected: {selectedNewPlayer.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedNewPlayer.team} • €
                      {(selectedNewPlayer.value / 1000).toFixed(0)}K
                      {selectedNewPlayer.points !== undefined &&
                        selectedNewPlayer.points > 0 && (
                          <span className="ml-2 text-green-400">
                            • {selectedNewPlayer.points} pts
                          </span>
                        )}
                      {(!selectedNewPlayer.points ||
                        selectedNewPlayer.points === 0) && (
                        <span className="ml-2 text-muted-foreground">
                          • No points yet
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRoleDialogOpen(true)}
                  >
                    {selectedRole
                      ? `Role: ${selectedRole.replace(/_/g, " ").toUpperCase()}`
                      : "Assign Role"}
                  </Button>
                </div>
              </div>
            )}

            {/* Search - Always visible */}
            <div className="px-6 pt-4 space-y-2 flex-shrink-0">
              <Label htmlFor="search">Search Players</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  disabled={isLoadingPlayers}
                />
              </div>
            </div>

            {/* Available Players - Grouped by Team */}
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
              {isLoadingPlayers ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
                  <p className="text-lg font-medium text-muted-foreground">
                    Loading available players...
                  </p>
                  <p className="text-sm text-muted-foreground/60 mt-2">
                    This may take a few seconds
                  </p>
                </div>
              ) : (
                <>
                  <Label className="mb-4 block">
                    Available Players ({filteredPlayers.length})
                  </Label>

                  {teams.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No affordable players found matching your search.
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {teams.map((teamName) => (
                        <div key={teamName}>
                          <h3 className="text-lg font-semibold mb-4 text-foreground sticky top-0 bg-neutral-950/95 backdrop-blur-sm py-2 z-10">
                            {teamName} ({playersByTeam[teamName]?.length || 0})
                          </h3>
                          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-900">
                            {playersByTeam[teamName]?.map((player) => (
                              <div
                                key={player.id}
                                className={cn(
                                  "w-[220px] flex-shrink-0 transition-all",
                                  selectedNewPlayer?.id === player.id &&
                                    "ring-2 ring-primary ring-offset-2 ring-offset-neutral-950 rounded-lg"
                                )}
                                onClick={() => handlePlayerSelect(player)}
                              >
                                <FantasyPlayerFlipCard
                                  player={player}
                                  onAdd={() => handlePlayerSelect(player)}
                                  disabled={false}
                                  budgetRemaining={budgetAfterSale}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <DialogFooter className="p-6 border-t border-neutral-800">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedNewPlayer || newBudget < 0 || isSubmitting}
            >
              {isSubmitting ? "Substituting..." : "Confirm Substitution"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Assignment Dialog for Selected Player */}
      {selectedNewPlayer && (
        <RoleAssignmentDialog
          open={roleDialogOpen}
          onOpenChange={setRoleDialogOpen}
          players={[
            {
              id: selectedNewPlayer.steam_id,
              name: selectedNewPlayer.name,
              team: selectedNewPlayer.team,
              role: selectedRole
            }
          ]}
          currentPlayerIndex={0}
          onRoleSelect={async (playerId, role) => {
            setSelectedRole(role);
            setRoleDialogOpen(false);
            return true;
          }}
          onNavigate={() => {}}
          autoAdvance={false}
        />
      )}
    </>
  );
}
