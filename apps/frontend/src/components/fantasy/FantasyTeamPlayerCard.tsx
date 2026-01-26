"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import FantasyPlayerFlipCard from "./FantasyPlayerFlipCard";
import { createTeamLogoUrl } from "@/lib/utils";
import type { FantasyPlayer } from "./FantasyLeague";
import type { MyFantasyTeam } from "@/hooks/data/useMyFantasyTeam";
import { calculatePlayerTier } from "@eggosystem/types";

type FantasyTeamPlayerCardProps = {
  player: MyFantasyTeam["players"][number];
  existingTeam: MyFantasyTeam;
  roleChangesRemaining: number;
  substitutionsRemaining: number;
  onAssignRole: () => void;
  onSubstitute: () => void;
  onViewPoints: () => void;
};

export function FantasyTeamPlayerCard({
  player,
  existingTeam,
  roleChangesRemaining,
  substitutionsRemaining,
  onAssignRole,
  onSubstitute,
  onViewPoints
}: FantasyTeamPlayerCardProps) {
  const teamLogoForPlayer = player.team_logo
    ? createTeamLogoUrl(player.team_logo)
    : player.team_name
      ? createTeamLogoUrl(
          player.team_name.toLowerCase().replace(/\s+/g, "-") + ".png"
        )
      : "/team-images/nologo.png";

  const fantasyPlayer: FantasyPlayer = {
    id: parseInt(String(player.steam_id).slice(-9)),
    steam_id: String(player.steam_id),
    name: player.nickname,
    team: player.team_name || "Free Agent",
    teamLogo: teamLogoForPlayer,
    value: player.player_value,
    tier: player.tier || calculatePlayerTier(player.player_value),
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
    <div className="space-y-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <FantasyPlayerFlipCard
              player={fantasyPlayer}
              onAdd={() => {}}
              disabled={true}
              budgetRemaining={existingTeam.budget_remaining}
              isExistingTeamPlayer={true}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Click to flip and view detailed stats
        </TooltipContent>
      </Tooltip>

      {/* Controls below the card */}
      <div className="space-y-2">
        {/* Role Display */}
        {player.role ? (
          <div className="text-center p-2 bg-neutral-900/50 border border-neutral-800 rounded-lg">
            <p className="text-xs text-green-400 font-medium">
              {player.role.replace(/_/g, " ").toUpperCase()}
            </p>
          </div>
        ) : (
          <div className="text-center p-2 bg-neutral-900/50 border border-neutral-800 rounded-lg">
            <p className="text-xs text-muted-foreground">NO ROLE ASSIGNED</p>
          </div>
        )}

        {/* Assign/Swap Role Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onAssignRole}
          disabled={roleChangesRemaining <= 0}
          className="w-full"
        >
          {player.role ? "Swap Role" : "Assign Role"}
        </Button>

        {/* Replace Player Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onSubstitute}
          disabled={substitutionsRemaining <= 0 || player.has_played_this_week}
          className="w-full"
          title={
            player.has_played_this_week
              ? "This player has already played this week and cannot be substituted"
              : ""
          }
        >
          {player.has_played_this_week ? "Locked (Played)" : "Replace Player"}
        </Button>

        {/* View Points Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onViewPoints}
          className="w-full"
        >
          View Points
        </Button>
      </div>
    </div>
  );
}
