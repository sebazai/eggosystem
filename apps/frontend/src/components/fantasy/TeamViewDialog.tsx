"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FantasyPlayerFlipCard from "./FantasyPlayerFlipCard";
import { createTeamLogoUrl } from "@/lib/utils";
import type { MyFantasyTeam } from "@/hooks/data/useMyFantasyTeam";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: MyFantasyTeam | null;
};

export default function TeamViewDialog({ open, onOpenChange, team }: Props) {
  if (!team) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[1150px] w-[95vw] max-h-[90vh] h-[90vh] p-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl mb-1">
                {team.team_name}
              </DialogTitle>
              <DialogDescription className="text-sm">
                View team details and player roles
              </DialogDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">
                {team.total_points.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Team Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-neutral-900/50 rounded-lg border border-neutral-800">
                  <div className="text-xl font-bold text-white">
                    €{(team.budget_remaining / 1000).toFixed(0)}K
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Budget Remaining
                  </div>
                </div>
                <div className="text-center p-3 bg-neutral-900/50 rounded-lg border border-neutral-800">
                  <div className="text-xl font-bold text-white">
                    {team.players.length}/5
                  </div>
                  <div className="text-sm text-muted-foreground">Players</div>
                </div>
                <div className="text-center p-3 bg-neutral-900/50 rounded-lg border border-neutral-800">
                  <div className="text-xl font-bold text-white">
                    Week {team.current_week_number || 1}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Current Week
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Players */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Team Players
                <Badge variant="outline">{team.players.length}/5</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {team.players.map((player) => {
                  // Convert existing team player to FantasyPlayer format
                  const teamLogoForPlayer = player.team_logo
                    ? createTeamLogoUrl(player.team_logo)
                    : player.team_name
                      ? createTeamLogoUrl(
                          player.team_name.toLowerCase().replace(/\s+/g, "-") +
                            ".png"
                        )
                      : "/team-images/nologo.png";

                  const fantasyPlayer = {
                    id: parseInt(String(player.steam_id).slice(-9)),
                    steam_id: String(player.steam_id),
                    name: player.nickname,
                    team: player.team_name || "Free Agent",
                    teamLogo: teamLogoForPlayer,
                    value: player.player_value,
                    tier: player.tier || "bronze", // Default to bronze if not set
                    photo: undefined,
                    stats: {
                      rating: player.kana_rating || 0,
                      kills: player.kills || 0,
                      deaths: player.deaths || 0,
                      kd: player.kd || 0,
                      adr: player.adr || undefined,
                      adrT: player.adr_t || undefined,
                      adrCT: player.adr_ct || undefined,
                      headshots: player.headshots || 0,
                      headshotPercentage: player.headshot_percentage || 0,
                      flashAssists: player.flash_assists || 0,
                      firstKills: player.first_kills || 0,
                      firstDeaths: player.first_deaths || 0,
                      kast: player.kast || 0
                    },
                    role: player.role || undefined,
                    points: player.points_earned || 0
                  };

                  return (
                    <div key={player.steam_id} className="space-y-2">
                      <FantasyPlayerFlipCard
                        player={fantasyPlayer}
                        onAdd={() => {}} // No-op for viewing
                        disabled={true} // Always disabled for viewing
                        budgetRemaining={team.budget_remaining}
                        isExistingTeamPlayer={true}
                      />

                      {/* Role Display */}
                      {player.role ? (
                        <div className="text-center p-2 bg-neutral-900/50 border border-neutral-800 rounded-lg">
                          <p className="text-xs text-green-400 font-medium uppercase">
                            {player.role.replace(/_/g, " ")}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center p-2 bg-neutral-900/50 border border-neutral-800 rounded-lg">
                          <p className="text-xs text-muted-foreground">
                            NO ROLE
                          </p>
                        </div>
                      )}

                      {/* Player Stats */}
                      <div className="text-center p-2 bg-neutral-900/50 border border-neutral-800 rounded-lg">
                        <p className="text-sm font-medium text-white">
                          {player.points_earned || 0} pts
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Points Earned
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
