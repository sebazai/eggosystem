"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeagueSelector } from "@/components/league/LeagueSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import FantasyPlayerFlipCard from "./FantasyPlayerFlipCard";
import SelectedTeamPanel from "./SelectedTeamPanel";
import type { FantasyPlayer, SelectedPlayer } from "./FantasyLeague";
import type { PlayerTier } from "@eggosystem/types";

const BUDGET = 1000000;

type FantasyDraftInterfaceProps = {
  seasonLeagues:
    | Array<{ id: number; name: string; tier?: number | null }>
    | undefined;
  isLoadingLeagues: boolean;
  selectedLeagueId: string;
  onLeagueChange: (leagueId: string) => void;
  selectedPlayers: SelectedPlayer[];
  onAddPlayer: (player: FantasyPlayer) => void;
  onRemovePlayer: (playerId: number) => void;
  onFinalize: () => void;
  budgetRemaining: number;
  teamName: string;
  onTeamNameChange: (name: string) => void;
  teamNameError: string | null;
  isSubmitting: boolean;
  submitError: string | null;
  isLoadingPlayers: boolean;
  fantasyPlayers: FantasyPlayer[];
  filterTier: PlayerTier | "all";
  onFilterTierChange: (tier: PlayerTier | "all") => void;
  sortBy: "value" | "name" | "rating";
  onSortByChange: (sortBy: "value" | "name" | "rating") => void;
  playersByTeam: Record<string, FantasyPlayer[]>;
  teams: string[];
  budgetUsed: number;
};

export function FantasyDraftInterface({
  seasonLeagues,
  isLoadingLeagues,
  selectedLeagueId,
  onLeagueChange,
  selectedPlayers,
  onAddPlayer,
  onRemovePlayer,
  onFinalize,
  budgetRemaining,
  teamName,
  onTeamNameChange,
  teamNameError,
  isSubmitting,
  submitError,
  isLoadingPlayers,
  fantasyPlayers,
  filterTier,
  onFilterTierChange,
  sortBy,
  onSortByChange,
  playersByTeam,
  teams,
  budgetUsed
}: FantasyDraftInterfaceProps) {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Fantasy League - Team Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium">Select League</label>
              <LeagueSelector
                value={selectedLeagueId || null}
                onValueChange={onLeagueChange}
                placeholder="Choose a league"
                triggerClassName="w-full md:w-[300px]"
                leagues={
                  seasonLeagues?.map((l) => ({
                    id: String(l.id),
                    name: l.name,
                    tier: l.tier
                  })) ?? []
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">Budget</div>
              <div className="flex items-center gap-4">
                <div className="text-xl font-bold">
                  €{budgetRemaining.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  / €{BUDGET.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">Team Slots</div>
              <div className="text-xl font-bold">
                {selectedPlayers.length} / 5
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Team - Horizontal Row */}
      <SelectedTeamPanel
        selectedPlayers={selectedPlayers}
        onRemovePlayer={onRemovePlayer}
        onFinalize={onFinalize}
        budgetRemaining={budgetRemaining}
        teamName={teamName}
        onTeamNameChange={onTeamNameChange}
        teamNameError={teamNameError}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />

      {isLoadingPlayers && selectedLeagueId && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Loading players...
          </CardContent>
        </Card>
      )}

      {!selectedLeagueId && !isLoadingLeagues && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Please select a league to view available players
          </CardContent>
        </Card>
      )}

      {selectedLeagueId && !isLoadingPlayers && fantasyPlayers.length > 0 && (
        <>
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    Filter by Tier
                  </label>
                  <Select
                    value={filterTier}
                    onValueChange={(value) =>
                      onFilterTierChange(value as PlayerTier | "all")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    Sort by
                  </label>
                  <Select
                    value={sortBy}
                    onValueChange={(value) =>
                      onSortByChange(value as "value" | "name" | "rating")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">
                        Rating (High to Low)
                      </SelectItem>
                      <SelectItem value="value">Value (High to Low)</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Players Grouped by Team */}
          <div className="space-y-6">
            {teams.map((teamName) => (
              <div key={teamName} className="space-y-3">
                <h3 className="text-xl font-bold text-foreground px-2">
                  {teamName}
                </h3>
                <div className="relative overflow-hidden">
                  <div className="overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin">
                    <div className="flex gap-4 px-2">
                      {playersByTeam[teamName]?.map((player) => (
                        <div
                          key={player.id}
                          className="w-[220px] flex-shrink-0"
                        >
                          <FantasyPlayerFlipCard
                            player={player}
                            onAdd={onAddPlayer}
                            disabled={
                              selectedPlayers.length >= 5 ||
                              budgetUsed + player.value > BUDGET
                            }
                            budgetRemaining={budgetRemaining}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedLeagueId && !isLoadingPlayers && fantasyPlayers.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No players found for this league
          </CardContent>
        </Card>
      )}
    </div>
  );
}
