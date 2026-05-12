"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { RefreshCw, UserX, TrendingUp } from "lucide-react";
import FantasyPlayerFlipCard from "./FantasyPlayerFlipCard";
import { createTeamLogoUrl, createAvatarUrl } from "@/lib/utils";
import type { FantasyPlayer } from "./FantasyLeague";
import type { MyFantasyTeam } from "@/hooks/data/useMyFantasyTeam";
import { calculatePlayerTier } from "@eggosystem/types";

type NextMatchInfo = {
  opponent: string;
  date: string;
};

type FantasyTeamPlayerCardProps = {
  player: MyFantasyTeam["players"][number];
  existingTeam: MyFantasyTeam;
  roleChangesRemaining: number;
  substitutionsRemaining: number;
  nextMatch?: NextMatchInfo;
  onAssignRole: () => void;
  onSubstitute: () => void;
  onViewPoints: () => void;
};

export function FantasyTeamPlayerCard({
  player,
  existingTeam,
  roleChangesRemaining,
  substitutionsRemaining,
  nextMatch,
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
    photo: player.avatar ? createAvatarUrl(player.avatar) : undefined,
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
        {/* Next Match */}
        {nextMatch && (
          <div className="text-center px-2 py-1.5 bg-neutral-900/50 border border-neutral-800 rounded-lg space-y-0">
            <div className="text-xs text-muted-foreground truncate px-1 leading-tight">
              next vs{" "}
              <span className="text-white font-medium">
                {nextMatch.opponent}
              </span>
            </div>
            <div className="text-xs text-muted-foreground leading-tight">
              {nextMatch.date}
            </div>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex gap-1.5">
          {/* Assign/Swap Role Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onAssignRole}
                disabled={roleChangesRemaining <= 0}
                className="flex-1 px-2"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{player.role ? "Change Role" : "Assign Role"}</p>
              {roleChangesRemaining <= 0 && (
                <p className="text-xs text-muted-foreground">
                  No role swaps remaining this week
                </p>
              )}
            </TooltipContent>
          </Tooltip>

          {/* Replace Player Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onSubstitute}
                disabled={
                  substitutionsRemaining <= 0 || player.has_played_this_week
                }
                className="flex-1 px-2"
              >
                <UserX className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {player.has_played_this_week
                  ? "Player Locked (Already Played)"
                  : "Replace Player"}
              </p>
              {substitutionsRemaining <= 0 && !player.has_played_this_week && (
                <p className="text-xs text-muted-foreground">
                  No substitutions remaining this week
                </p>
              )}
            </TooltipContent>
          </Tooltip>

          {/* View Points Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onViewPoints}
                className="flex-1 px-2"
              >
                <TrendingUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Point History</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
