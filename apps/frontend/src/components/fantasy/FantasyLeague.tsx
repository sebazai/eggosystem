"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FantasyTeamView } from "./FantasyTeamView";
import { FantasyDraftInterface } from "./FantasyDraftInterface";
import { useSeasonLeagues } from "@/hooks/data/useSeasonLeagues";
import { useFantasyPlayers } from "@/hooks/data/useFantasyPlayers";
import { useMyFantasyTeam } from "@/hooks/data/useMyFantasyTeam";
import { createTeamLogoUrl, expressFetcher } from "@/lib/utils";
import { clientApiFetch } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { SteamLoginButton } from "@/components/profile/SteamLoginButton";
import { type PlayerTier } from "@eggosystem/types";
import type { PlayerRole } from "./RoleAssignmentDialog";

export type FantasyPlayer = {
  id: number;
  steam_id: string; // Original steam_id for backend API calls
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
  role?: string;
  points?: number; // Points earned by the player
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

export default function FantasyLeague({ seasonId }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayer[]>([]);
  const [filterTier, setFilterTier] = useState<PlayerTier | "all">("all");
  const [sortBy, setSortBy] = useState<"value" | "name" | "rating">("rating");
  const [teamName, setTeamName] = useState<string>("");
  const [teamNameError, setTeamNameError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [substitutionsRemaining, setSubstitutionsRemaining] =
    useState<number>(2); // Will be updated from backend
  const [userRank, setUserRank] = useState<number | null>(null);
  const [totalTeams, setTotalTeams] = useState<number>(0);

  // Fetch leagues for the season
  const { seasonLeagues, isLoading: isLoadingLeagues } =
    useSeasonLeagues(seasonId);

  // Fetch user's existing team
  const {
    team: existingTeam,
    isLoading: isLoadingTeam,
    error: teamError,
    mutate
  } = useMyFantasyTeam(seasonId);

  // Initialize role swaps and substitutions from backend data
  useEffect(() => {
    if (existingTeam) {
      if (existingTeam.remaining_role_swaps !== undefined) {
        setRoleChangesRemaining(existingTeam.remaining_role_swaps);
      }
      if (existingTeam.remaining_substitutions !== undefined) {
        setSubstitutionsRemaining(existingTeam.remaining_substitutions);
      }
    }
  }, [existingTeam]);

  // Fetch user's rank when team is loaded
  useEffect(() => {
    if (existingTeam && existingTeam.league_id && existingTeam.steam_id) {
      // Use steam_id directly to get rank
      expressFetcher<{ currentUserRank: number | null; totalTeams: number }>(
        `/api/v1/seasons/${seasonId}/fantasy/leagues/${existingTeam.league_id}/leaderboard?steam_id=${existingTeam.steam_id}`,
        { credentials: "include" }
      )
        .then((data) => {
          setUserRank(data.currentUserRank ?? null);
          setTotalTeams(data.totalTeams ?? 0);
        })
        .catch(() => {
          // Set to null on error to show "-"
          setUserRank(null);
          setTotalTeams(0);
        });
    } else {
      // Reset when team is not loaded
      setUserRank(null);
      setTotalTeams(0);
    }
  }, [existingTeam, seasonId]);

  // If user has existing team, fetch players from their league for substitutions
  const leagueIdForPlayers =
    existingTeam?.league_id?.toString() || selectedLeagueId;

  // Fetch players for selected league
  const { players, isLoading: isLoadingPlayers } = useFantasyPlayers(
    seasonId,
    leagueIdForPlayers || null
  );

  // Convert backend players to FantasyPlayer format
  const fantasyPlayers = useMemo<FantasyPlayer[]>(() => {
    if (!players) return [];

    return players.map((p) => {
      // Use value and tier from backend API (already calculated with proper logic)
      const value = p.value;
      const tier = p.tier;

      return {
        id: parseInt(String(p.steam_id).slice(-9)), // Convert to string first, then use last 9 digits as number
        steam_id: String(p.steam_id), // Store original steam_id for backend API calls
        name: p.nickname,
        team: p.team_name,
        teamLogo: p.team_logo
          ? createTeamLogoUrl(p.team_logo)
          : "/team-images/nologo.png",
        value, // Use API value
        tier, // Use API tier
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
          killsPerRound:
            p.maps_played > 0 ? p.kills / (p.maps_played * 24) : undefined // Estimate ~24 rounds per map
        }
      };
    });
  }, [players]);

  const budgetUsed = useMemo(
    () => selectedPlayers.reduce((sum, p) => sum + p.value, 0),
    [selectedPlayers]
  );
  const budgetRemaining = useMemo(() => BUDGET - budgetUsed, [budgetUsed]);

  const handleAddPlayer = useCallback((player: FantasyPlayer) => {
    setSelectedPlayers((prev) => {
      // Prevent selecting more than 5 players
      if (prev.length >= 5) {
        console.warn("Cannot add player: team already has 5 players");
        return prev;
      }

      // Prevent selecting the same player twice
      if (prev.some((p) => p.id === player.id)) {
        console.warn("Cannot add player: player already selected");
        return prev;
      }

      const currentBudgetUsed = prev.reduce((sum, p) => sum + p.value, 0);
      if (currentBudgetUsed + player.value > BUDGET) {
        console.warn("Cannot add player: insufficient budget");
        return prev;
      }

      return [...prev, { ...player, role: undefined }];
    });
  }, []);

  const handleRemovePlayer = useCallback((playerId: number) => {
    setSelectedPlayers((prev) => prev.filter((p) => p.id !== playerId));
  }, []);

  const validateTeamName = useCallback((name: string): string | null => {
    if (!name || name.trim().length < 3) {
      return "Team name must be at least 3 characters";
    }
    if (name.length > 30) {
      return "Team name must be less than 30 characters";
    }
    // Could add profanity filter here if needed
    return null;
  }, []);

  const handleTeamNameChange = useCallback(
    (name: string) => {
      setTeamName(name);
      // Defer validation to avoid blocking typing
      const error = validateTeamName(name);
      setTeamNameError(error);
    },
    [validateTeamName]
  );

  const handleFinalizeTeam = async () => {
    // Check authentication first
    if (!user) {
      setSubmitError(
        "You must be logged in to create a fantasy team. Please log in with Steam."
      );
      return;
    }

    // Validate team name before proceeding
    const nameError = validateTeamName(teamName);
    if (nameError) {
      setTeamNameError(nameError);
      return;
    }

    if (!selectedLeagueId) {
      setSubmitError("Please select a league");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Map selected players to API format
      const playersPayload = selectedPlayers.map((player) => {
        return {
          player_id: player.steam_id, // Use the original steam_id
          role: player.role || null,
          player_value: player.value
        };
      });

      await clientApiFetch<{
        team_id: number;
        success: boolean;
        message: string;
      }>(`/api/v1/seasons/${seasonId}/fantasy/teams`, {
        method: "POST",
        body: JSON.stringify({
          league_id: parseInt(selectedLeagueId),
          team_name: teamName.trim(),
          players: playersPayload
        })
      });

      // Success! Show success message and reload
      toast.success(`Team "${teamName}" created successfully!`);

      // Reload the page to show the created team
      window.location.reload();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to create team"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const [roleChangesRemaining, setRoleChangesRemaining] = useState(2); // 2 role changes per week

  const handleRoleSelect = useCallback(
    async (
      playerId: string,
      role: PlayerRole | undefined
    ): Promise<boolean> => {
      if (!existingTeam) return false;

      const player = existingTeam.players.find((p) => p.steam_id === playerId);
      if (!player) return false;

      const isSwap = player.role !== null; // It's a swap if the player already has a role

      // Only check role changes remaining if it's an actual swap
      if (isSwap && roleChangesRemaining <= 0) {
        toast.error("No role changes remaining this week");
        return false;
      }

      // Check if role actually changed
      if (player.role === role) {
        return false; // No change, don't save
      }

      setIsSubmitting(true);

      try {
        // Server determines if it's a swap or initial assignment
        const response = await clientApiFetch<{
          success: boolean;
          remaining_swaps: number;
        }>(`/api/v1/seasons/${seasonId}/fantasy/teams/me/roles`, {
          method: "PUT",
          body: JSON.stringify({
            role_updates: [
              {
                player_id: playerId,
                role: role || null
              }
            ]
          })
        });

        const roleName = role
          ? role.replace(/_/g, " ").toUpperCase()
          : "No Role";
        toast.success(
          `Role "${roleName}" ${isSwap ? "updated" : "assigned"} for ${player.nickname}`
        );
        setRoleChangesRemaining(response.remaining_swaps); // Use backend's remaining swaps
        mutate(); // Revalidate team data
        return true; // Success
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update role"
        );
        return false; // Error
      } finally {
        setIsSubmitting(false);
      }
    },
    [existingTeam, roleChangesRemaining, seasonId, mutate]
  );

  const handleConfirmSubstitution = useCallback(
    async (
      newPlayerSteamId: string,
      newPlayerValue: number,
      role?: string,
      removePlayerId?: string
    ) => {
      if (!existingTeam) return;

      setIsSubmitting(true);

      try {
        // Use current week number from backend, fallback to week 1
        const weekNumber = existingTeam.current_week_number || 1;

        const response = await clientApiFetch<{
          success: boolean;
          remaining_substitutions: number;
        }>(`/api/v1/seasons/${seasonId}/fantasy/teams/me/players`, {
          method: "PUT",
          body: JSON.stringify({
            remove_player_id: removePlayerId || "",
            add_player_id: newPlayerSteamId,
            new_player_value: newPlayerValue,
            week_number: weekNumber,
            role: role
          })
        });

        // If role is provided, assign it (this doesn't count as a role swap since it's a new player)
        if (role) {
          try {
            // Server automatically determines this is an initial assignment (not a swap)
            await clientApiFetch(
              `/api/v1/seasons/${seasonId}/fantasy/teams/me/roles`,
              {
                method: "PUT",
                body: JSON.stringify({
                  role_updates: [
                    {
                      player_id: newPlayerSteamId,
                      role: role
                    }
                  ]
                })
              }
            );
          } catch {
            // Don't fail the substitution if role assignment fails
          }
        }

        toast.success("Player substituted successfully!");
        setSubstitutionsRemaining(response.remaining_substitutions);
        mutate();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to substitute player"
        );
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [existingTeam, seasonId, mutate]
  );

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let filtered = fantasyPlayers.filter(
      (p) =>
        !selectedPlayers.some(
          (sp) => sp.id === p.id || sp.steam_id === p.steam_id
        )
    );

    if (filterTier !== "all") {
      filtered = filtered.filter((p) => p.tier === filterTier);
    }

    // Create a new array for sorting to avoid mutating the original
    const sorted = [...filtered].sort((a, b) => {
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

    return sorted;
  }, [fantasyPlayers, selectedPlayers, filterTier, sortBy]);

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

  // Sort teams alphabetically by name to maintain consistent order during drafting
  const teams = useMemo(() => {
    return Object.keys(playersByTeam).sort((a, b) => a.localeCompare(b));
  }, [playersByTeam]);

  // Show login prompt if not authenticated or if we get auth errors
  const isAuthError =
    teamError &&
    (teamError.message?.includes("token") ||
      teamError.message?.includes("auth") ||
      teamError.message?.includes("unauthorized") ||
      (typeof teamError === "object" &&
        "status" in teamError &&
        (teamError.status === 401 || teamError.status === 403)));

  if (!authLoading && (!user || isAuthError)) {
    return (
      <div className="py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Fantasy League - Team Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="py-8">
            <div className="max-w-md mx-auto text-center space-y-4">
              <div className="text-6xl">🔒</div>
              <h3 className="text-xl font-semibold">Authentication Required</h3>
              <p className="text-muted-foreground">
                You need to be logged in with your Steam account to create and
                manage fantasy teams.
              </p>
              <SteamLoginButton />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if team loading failed (but not for 404 - that means no team exists, which is fine)
  // Check if error is a 404/NotFoundError - if so, treat it as "no team" rather than an error
  const isNotFoundError =
    teamError &&
    ((teamError instanceof Error && teamError.message.includes("not found")) ||
      (typeof teamError === "object" &&
        "status" in teamError &&
        (teamError as { status?: number }).status === 404));

  if (teamError && !isLoadingTeam && !isNotFoundError && !isAuthError) {
    return (
      <div className="py-8 text-center space-y-4">
        <div className="p-6 bg-red-950/50 border border-red-800/50 rounded-xl">
          <h2 className="text-2xl font-bold text-red-400 mb-2">
            Error Loading Your Team
          </h2>
          <p className="text-muted-foreground mb-4">
            We encountered an error while loading your fantasy team. Your team
            data is safe, but we couldn&apos;t display it right now.
          </p>
          <p className="text-sm text-red-300 font-mono bg-red-950/30 p-3 rounded border border-red-800/30">
            {teamError instanceof Error ? teamError.message : String(teamError)}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4"
            variant="outline"
          >
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  // If user has an existing team, show team view instead of draft interface
  if (existingTeam && !isLoadingTeam) {
    return (
      <FantasyTeamView
        existingTeam={existingTeam}
        seasonId={seasonId}
        userRank={userRank}
        totalTeams={totalTeams}
        roleChangesRemaining={roleChangesRemaining}
        substitutionsRemaining={substitutionsRemaining}
        fantasyPlayers={fantasyPlayers}
        onRoleSelect={handleRoleSelect}
        onConfirmSubstitution={handleConfirmSubstitution}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
    <FantasyDraftInterface
      seasonLeagues={seasonLeagues}
      isLoadingLeagues={isLoadingLeagues}
      selectedLeagueId={selectedLeagueId}
      onLeagueChange={setSelectedLeagueId}
      selectedPlayers={selectedPlayers}
      onAddPlayer={handleAddPlayer}
      onRemovePlayer={handleRemovePlayer}
      onFinalize={handleFinalizeTeam}
      budgetRemaining={budgetRemaining}
      teamName={teamName}
      onTeamNameChange={handleTeamNameChange}
      teamNameError={teamNameError}
      isSubmitting={isSubmitting}
      submitError={submitError}
      isLoadingPlayers={isLoadingPlayers}
      fantasyPlayers={fantasyPlayers}
      filterTier={filterTier}
      onFilterTierChange={setFilterTier}
      sortBy={sortBy}
      onSortByChange={setSortBy}
      playersByTeam={playersByTeam}
      teams={teams}
      budgetUsed={budgetUsed}
    />
  );
}
