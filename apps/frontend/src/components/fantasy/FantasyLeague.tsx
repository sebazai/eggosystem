"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import FantasyPlayerFlipCard from "./FantasyPlayerFlipCard";
import SelectedTeamPanel from "./SelectedTeamPanel";
import { useSeasonLeagues } from "@/hooks/data/useSeasonLeagues";
import { useFantasyPlayers } from "@/hooks/data/useFantasyPlayers";
import { createTeamLogoUrl } from "@/lib/utils";

export type PlayerTier = "bronze" | "silver" | "gold";

export type FantasyPlayer = {
  id: number;
  name: string;
  team: string;
  teamLogo?: string;
  value: number;
  tier: PlayerTier;
  photo?: string;
  stats: {
    rating: number;
    kills: number;
    deaths: number;
    kd: number;
    adr?: number;
    adrT?: number;
    adrCT?: number;
    headshots: number;
    headshotPercentage: number;
    flashAssists: number;
    firstKills: number;
    firstDeaths: number;
    kast?: number;
    killsPerRound?: number;
  };
};

export type SelectedPlayer = FantasyPlayer & {
  role?: 
    | "main_awp"
    | "leader"
    | "support"
    | "entry_fragger"
    | "defender"
    | "hs_machine"
    | "multi_fragger"
    | "attacker"
    | "camper"
    | "stathunter"
    | "noob"
    | "eco_friendly"
    | "flash_master"
    | "clutch_player"
    | "first_blood"
    | "t_specialist"
    | "ct_specialist"
    | "anchor";
};

type Props = {
  seasonId: string;
};

const BUDGET = 1000000;

// Helper to determine tier based on rating (based on actual data distribution)
// Gold: >= 0.95 (top ~15%), Silver: 0.80-0.94 (middle ~35%), Bronze: < 0.80 (bottom ~50%)
const calculateTier = (rating: number): PlayerTier => {
  if (rating >= 0.95) return "gold";
  if (rating >= 0.80) return "silver";
  return "bronze";
};

// Helper to calculate player value with normalized distribution
// Uses sigmoid compression to cluster values around 200K average
// Target range: 160K-240K with most players near 200K
const calculateValue = (rating: number, _tier: PlayerTier, kd: number, kills: number): number => {
  // Expected rating range from actual data
  const MIN_RATING = 0.40;
  const MAX_RATING = 1.10;
  
  // Normalize rating to 0-1 range
  const normalized = (rating - MIN_RATING) / (MAX_RATING - MIN_RATING);
  
  // Apply sigmoid compression (factor 6 for gentler S-curve)
  // This clusters most players near the center value
  const compressed = 1 / (1 + Math.exp(-6 * (normalized - 0.5)));
  
  // Map to target range: 165K base + 70K spread = 165K-235K range
  const BASE = 165000;
  const SPREAD = 70000;
  let baseValue = BASE + (compressed * SPREAD);
  
  // Small K/D adjustment (±4%)
  const kdBonus = Math.min(Math.max((kd - 1.0) * 0.04, -0.02), 0.04);
  baseValue = baseValue * (1 + kdBonus);
  
  // Small kill volume bonus (max +2.5%)
  const killBonus = Math.min(kills / 6000, 0.025);
  baseValue = baseValue * (1 + killBonus);
  
  // Final bounds
  return Math.floor(Math.max(160000, Math.min(240000, baseValue)));
};

export default function FantasyLeague({ seasonId }: Props) {
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayer[]>([]);
  const [filterTier, setFilterTier] = useState<PlayerTier | "all">("all");
  const [sortBy, setSortBy] = useState<"value" | "name" | "rating">("rating");

  // Fetch leagues for the season
  const { seasonLeagues, isLoading: isLoadingLeagues } = useSeasonLeagues(seasonId);
  
  // Fetch players for selected league
  const { players, isLoading: isLoadingPlayers } = useFantasyPlayers(
    seasonId,
    selectedLeagueId || null
  );

  // Convert backend players to FantasyPlayer format
  const fantasyPlayers = useMemo<FantasyPlayer[]>(() => {
    if (!players) return [];
    
    return players.map((p) => {
      const tier = calculateTier(p.kana_rating);
      const value = calculateValue(p.kana_rating, tier, p.kd, p.kills);
      
      return {
        id: parseInt(String(p.steam_id).slice(-9)), // Convert to string first, then use last 9 digits as number
        name: p.nickname,
        team: p.team_name,
        teamLogo: p.team_logo ? createTeamLogoUrl(p.team_logo) : "/team-images/nologo.png",
        value,
        tier,
        stats: {
          rating: p.kana_rating,
          kills: p.kills,
          deaths: p.deaths,
          kd: p.kd,
          adr: p.adr || undefined,
          adrT: p.adr_t || undefined,
          adrCT: p.adr_ct || undefined,
          headshots: p.headshots,
          headshotPercentage: p.headshot_percentage,
          flashAssists: p.flash_assists,
          firstKills: p.first_kills,
          firstDeaths: p.first_deaths,
          kast: p.kast || undefined,
          killsPerRound: p.maps_played > 0 ? p.kills / (p.maps_played * 24) : undefined // Estimate ~24 rounds per map
        }
      };
    });
  }, [players]);

  const budgetUsed = selectedPlayers.reduce((sum, p) => sum + p.value, 0);
  const budgetRemaining = BUDGET - budgetUsed;

  const handleAddPlayer = (player: FantasyPlayer) => {
    if (selectedPlayers.length >= 5) {
      return;
    }
    if (budgetUsed + player.value > BUDGET) {
      return;
    }
    setSelectedPlayers([...selectedPlayers, { ...player, role: undefined }]);
  };

  const handleRemovePlayer = (playerId: number) => {
    setSelectedPlayers(selectedPlayers.filter((p) => p.id !== playerId));
  };

  const handleRoleChange = (playerId: number, role: SelectedPlayer["role"]) => {
    setSelectedPlayers(
      selectedPlayers.map((p) => (p.id === playerId ? { ...p, role } : p))
    );
  };

  const handleFinalizeTeam = () => {
    // This will be implemented later with backend integration
    alert("Team finalized! (Backend integration pending)");
  };

  // Filter and sort players
  let filteredPlayers = fantasyPlayers.filter(
    (p) => !selectedPlayers.some((sp) => sp.id === p.id)
  );

  if (filterTier !== "all") {
    filteredPlayers = filteredPlayers.filter((p) => p.tier === filterTier);
  }

  filteredPlayers.sort((a, b) => {
    switch (sortBy) {
      case "value":
        return b.value - a.value;
      case "name":
        return a.name.localeCompare(b.name);
      case "rating":
        return b.stats.rating - a.stats.rating;
      default:
        return 0;
    }
  });

  // Group players by team
  const playersByTeam = filteredPlayers.reduce((acc, player) => {
    if (!acc[player.team]) {
      acc[player.team] = [];
    }
    acc[player.team]!.push(player);
    return acc;
  }, {} as Record<string, FantasyPlayer[]>);

  const teams = Object.keys(playersByTeam);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Fantasy League - Team Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium">Select League</label>
              <Select value={selectedLeagueId} onValueChange={setSelectedLeagueId}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder={isLoadingLeagues ? "Loading..." : "Choose a league"} />
                </SelectTrigger>
                <SelectContent>
                  {seasonLeagues?.map((league) => (
                    <SelectItem key={league.id} value={league.id.toString()}>
                      {league.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">Budget</div>
              <div className="flex items-center gap-4">
                <div className="text-xl font-bold">
                  ${budgetRemaining.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  / ${BUDGET.toLocaleString()}
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
        onRemovePlayer={handleRemovePlayer}
        onRoleChange={handleRoleChange}
        onFinalize={handleFinalizeTeam}
        budgetRemaining={budgetRemaining}
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
                  <label className="text-sm font-medium mb-2 block">Filter by Tier</label>
                  <Select
                    value={filterTier}
                    onValueChange={(value) => setFilterTier(value as PlayerTier | "all")}
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
                  <label className="text-sm font-medium mb-2 block">Sort by</label>
                  <Select
                    value={sortBy}
                    onValueChange={(value) =>
                      setSortBy(value as "value" | "name" | "rating")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Rating (High to Low)</SelectItem>
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
                <h3 className="text-xl font-bold text-foreground px-2">{teamName}</h3>
                <div className="relative overflow-hidden">
                  <div className="overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin">
                    <div className="flex gap-4 px-2">
                      {playersByTeam[teamName]?.map((player) => (
                        <div key={player.id} className="w-[220px] flex-shrink-0">
                          <FantasyPlayerFlipCard
                            player={player}
                            onAdd={handleAddPlayer}
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
