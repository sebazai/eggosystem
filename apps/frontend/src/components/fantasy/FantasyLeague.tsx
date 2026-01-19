"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
import SubstitutionDialog from "./SubstitutionDialog";
import RoleAssignmentDialog, { type PlayerRole } from "./RoleAssignmentDialog";
import PlayerPointHistory from "./PlayerPointHistory";
import { useSeasonLeagues } from "@/hooks/data/useSeasonLeagues";
import { useFantasyPlayers } from "@/hooks/data/useFantasyPlayers";
import {
  useMyFantasyTeam,
  type MyFantasyTeam
} from "@/hooks/data/useMyFantasyTeam";
import { createTeamLogoUrl, expressFetcher, cn } from "@/lib/utils";
import { clientApiFetch } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, TrendingUp, Award } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { SteamLoginButton } from "@/components/profile/SteamLoginButton";
import { type PlayerTier, calculatePlayerTier } from "@eggosystem/types";

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
  const [showSubstitutionDialog, setShowSubstitutionDialog] =
    useState<boolean>(false);
  const [playerToReplace, setPlayerToReplace] = useState<{
    steam_id: string;
    nickname: string;
    team_name: string;
    player_value: number;
  } | null>(null);
  const [substitutionsRemaining, setSubstitutionsRemaining] =
    useState<number>(2); // Will be updated from backend
  const [selectedPlayerForPoints, setSelectedPlayerForPoints] = useState<
    MyFantasyTeam["players"][number] | null
  >(null);
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

  const budgetUsed = selectedPlayers.reduce((sum, p) => sum + p.value, 0);
  const budgetRemaining = BUDGET - budgetUsed;

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

  const [_editingRoles, setEditingRoles] = useState(false);
  const [roleChangesRemaining, setRoleChangesRemaining] = useState(2); // 2 role changes per week
  const [tempRoles, setTempRoles] = useState<
    Record<string, string | undefined>
  >({});
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [currentRolePlayerIndex, setCurrentRolePlayerIndex] = useState(0);

  const _handleStartEditingRoles = useCallback(() => {
    if (!existingTeam) return;
    // Initialize temp roles with current roles
    const currentRoles: Record<string, string | undefined> = {};
    existingTeam.players.forEach((p) => {
      currentRoles[p.steam_id] = p.role || undefined;
    });
    setTempRoles(currentRoles);
    setCurrentRolePlayerIndex(0);
    setRoleDialogOpen(true);
  }, [existingTeam]);

  const _handleCancelEditingRoles = useCallback(() => {
    setTempRoles({});
    setRoleDialogOpen(false);
  }, []);

  const _handleTempRoleChange = useCallback(
    (playerId: string, role: string | undefined) => {
      setTempRoles((prev) => ({ ...prev, [playerId]: role }));
    },
    []
  );

  const handleRoleSelect = async (
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
          ],
          skip_swap_limit: !isSwap // Skip limit check if it's an initial assignment
        })
      });

      const roleName = role ? role.replace(/_/g, " ").toUpperCase() : "No Role";
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
  };

  const _handleSaveRoles = async () => {
    if (!existingTeam) return;

    setIsSubmitting(true);

    try {
      // Calculate which roles actually changed
      const roleUpdates = existingTeam.players
        .map((p) => ({
          player_id: p.steam_id,
          old_role: p.role || null,
          new_role: tempRoles[p.steam_id] || null
        }))
        .filter((update) => update.old_role !== update.new_role)
        .map((update) => ({
          player_id: update.player_id,
          role: update.new_role
        }));

      if (roleUpdates.length === 0) {
        toast.info("No role changes detected");
        setEditingRoles(false);
        return;
      }

      if (roleUpdates.length > roleChangesRemaining) {
        toast.error(
          `You can only change ${roleChangesRemaining} role(s) this week`
        );
        return;
      }

      await clientApiFetch(
        `/api/v1/seasons/${seasonId}/fantasy/teams/me/roles`,
        {
          method: "PUT",
          body: JSON.stringify({ role_updates: roleUpdates })
        }
      );

      toast.success("Roles updated successfully!");
      setRoleChangesRemaining((prev) => prev - roleUpdates.length);
      setEditingRoles(false);
      setRoleDialogOpen(false);
      mutate(); // Revalidate team data
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update roles"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSubstitution = async (
    newPlayerSteamId: string,
    newPlayerValue: number,
    role?: string
  ) => {
    if (!playerToReplace) return;

    setIsSubmitting(true);

    try {
      // Use current week number from backend, fallback to week 1
      const weekNumber = existingTeam?.current_week_number || 1;

      const response = await clientApiFetch<{
        success: boolean;
        remaining_substitutions: number;
      }>(`/api/v1/seasons/${seasonId}/fantasy/teams/me/players`, {
        method: "PUT",
        body: JSON.stringify({
          remove_player_id: playerToReplace.steam_id,
          add_player_id: newPlayerSteamId,
          new_player_value: newPlayerValue,
          week_number: weekNumber,
          role: role // Include role if provided
        })
      });

      // If role is provided, assign it (this doesn't count as a role swap since it's a new player)
      if (role) {
        try {
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
                ],
                skip_swap_limit: true // Flag to indicate this is during substitution, not a swap
              })
            }
          );
        } catch {
          // Don't fail the substitution if role assignment fails
          // Error is already handled by toast.error in handleUpdateRole
        }
      }

      // Success! Update state
      toast.success("Player substituted successfully!");
      setSubstitutionsRemaining(response.remaining_substitutions);
      mutate(); // Revalidate team data
      setShowSubstitutionDialog(false);
      setPlayerToReplace(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to substitute player"
      );
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter and sort players
  let filteredPlayers = fantasyPlayers.filter(
    (p) =>
      !selectedPlayers.some(
        (sp) => sp.id === p.id || sp.steam_id === p.steam_id
      )
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
  const playersByTeam = filteredPlayers.reduce(
    (acc, player) => {
      if (!acc[player.team]) {
        acc[player.team] = [];
      }
      acc[player.team]!.push(player);
      return acc;
    },
    {} as Record<string, FantasyPlayer[]>
  );

  // Sort teams alphabetically by name to maintain consistent order during drafting
  const teams = Object.keys(playersByTeam).sort((a, b) => a.localeCompare(b));

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
      <div className="container mx-auto py-6">
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
      <div className="container mx-auto py-8 text-center space-y-4">
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
      <div className="container mx-auto py-6 space-y-6">
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
              <div className="relative p-3 bg-neutral-900/50 rounded-lg border border-neutral-800 overflow-hidden">
                <div className="relative">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Award className="h-3 w-3 text-muted-foreground" />
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Total Points
                    </p>
                  </div>
                  <p className="text-xl font-black text-white">
                    {existingTeam.total_points}
                  </p>
                </div>
              </div>
              <div className="relative p-3 bg-neutral-900/50 rounded-lg border border-neutral-800 overflow-hidden">
                <div className="relative">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                    Budget Remaining
                  </p>
                  <p className="text-xl font-black text-white">
                    €{(existingTeam.budget_remaining / 1000).toFixed(0)}K
                  </p>
                </div>
              </div>
              <div className="relative p-3 bg-neutral-900/50 rounded-lg border border-neutral-800 overflow-hidden">
                <div className="relative">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                    Players
                  </p>
                  <p className="text-xl font-black text-white">
                    {existingTeam.players.length}/5
                  </p>
                </div>
              </div>
              <div className="relative p-3 bg-neutral-900/50 rounded-lg border border-neutral-800 overflow-hidden">
                <div className="relative">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Rank
                    </p>
                  </div>
                  <p className="text-xl font-black text-white">
                    {userRank !== null ? userRank : "-"}
                    {userRank !== null && totalTeams > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {" "}
                        / {totalTeams}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "relative p-3 rounded-lg border overflow-hidden",
                  roleChangesRemaining > 0 && substitutionsRemaining > 0
                    ? "bg-neutral-900/50 border-green-800/50"
                    : "bg-neutral-900/50 border-red-800/50"
                )}
              >
                <div className="relative">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <RefreshCw
                      className={cn(
                        "h-3 w-3",
                        roleChangesRemaining > 0 && substitutionsRemaining > 0
                          ? "text-green-400"
                          : "text-red-400"
                      )}
                    />
                    <p
                      className={cn(
                        "text-[10px] font-medium uppercase tracking-wider",
                        roleChangesRemaining > 0 && substitutionsRemaining > 0
                          ? "text-green-400"
                          : "text-red-400"
                      )}
                    >
                      Swaps & Subs
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <div>
                      <p
                        className={cn(
                          "text-lg font-black",
                          roleChangesRemaining > 0 && substitutionsRemaining > 0
                            ? "text-white"
                            : "text-white"
                        )}
                      >
                        {roleChangesRemaining}
                        <span className="text-xs text-muted-foreground">
                          {" "}
                          / 2
                        </span>
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        Role Swaps
                      </p>
                    </div>
                    <div>
                      <p
                        className={cn(
                          "text-lg font-black",
                          roleChangesRemaining > 0 && substitutionsRemaining > 0
                            ? "text-white"
                            : "text-white"
                        )}
                      >
                        {substitutionsRemaining}
                        <span className="text-xs text-muted-foreground">
                          {" "}
                          / 2
                        </span>
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        Substitutions
                      </p>
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-1">
                    This Week
                  </p>
                </div>
              </div>
            </div>

            {/* Role Swaps Counter - Moved to header */}

            {/* Team Players - Using Same Card Component */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                Your Team
                <Badge variant="outline">{existingTeam.players.length}/5</Badge>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Sort players by steam_id for stable ordering (prevents reorder on role change) */}
                {[...existingTeam.players]
                  .sort((a, b) => a.steam_id.localeCompare(b.steam_id))
                  .map((player) => {
                    // Convert existing team player to FantasyPlayer format
                    // Use same logo logic as draft page - fallback to team name-based logo
                    const teamLogoForPlayer = player.team_logo
                      ? createTeamLogoUrl(player.team_logo)
                      : player.team_name
                        ? createTeamLogoUrl(
                            player.team_name
                              .toLowerCase()
                              .replace(/\s+/g, "-") + ".png"
                          )
                        : "/team-images/nologo.png";

                    const fantasyPlayer: FantasyPlayer = {
                      id: parseInt(String(player.steam_id).slice(-9)),
                      steam_id: String(player.steam_id),
                      name: player.nickname,
                      team: player.team_name || "Free Agent",
                      teamLogo: teamLogoForPlayer,
                      value: player.player_value,
                      tier:
                        player.tier || calculatePlayerTier(player.player_value), // Use tier from backend if available
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
                          onAdd={() => {}}
                          disabled={true}
                          budgetRemaining={existingTeam.budget_remaining}
                          isExistingTeamPlayer={true}
                        />

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
                              <p className="text-xs text-muted-foreground">
                                NO ROLE ASSIGNED
                              </p>
                            </div>
                          )}

                          {/* Assign/Swap Role Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Initialize temp roles with current roles
                              const currentRoles: Record<
                                string,
                                string | undefined
                              > = {};
                              existingTeam.players.forEach((p) => {
                                currentRoles[p.steam_id] = p.role || undefined;
                              });
                              setTempRoles(currentRoles);
                              // Set the current player index
                              const playerIndex =
                                existingTeam.players.findIndex(
                                  (p) => p.steam_id === player.steam_id
                                );
                              setCurrentRolePlayerIndex(playerIndex);
                              setRoleDialogOpen(true);
                            }}
                            disabled={roleChangesRemaining <= 0}
                            className="w-full"
                          >
                            {player.role ? "Swap Role" : "Assign Role"}
                          </Button>

                          {/* Replace Player Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSubstitutePlayer(player)}
                            disabled={
                              substitutionsRemaining <= 0 ||
                              player.has_played_this_week
                            }
                            className="w-full"
                            title={
                              player.has_played_this_week
                                ? "This player has already played this week and cannot be substituted"
                                : ""
                            }
                          >
                            {player.has_played_this_week
                              ? "Locked (Played)"
                              : "Replace Player"}
                          </Button>

                          {/* View Points Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPlayerForPoints(player)}
                            className="w-full"
                          >
                            View Points
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Substitution Info */}
            <div className="p-4 bg-blue-950/30 border border-blue-900/50 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>Substitutions:</strong> You have{" "}
                {substitutionsRemaining} substitution(s) remaining this week.
                You can substitute players to optimize your team performance.
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
                  player_id: playerToReplace.steam_id, // SubstitutionDialog expects player_id prop name
                  nickname: playerToReplace.nickname,
                  team_name: playerToReplace.team_name || "Free Agent",
                  player_value: playerToReplace.player_value
                }
              : null
          }
          availablePlayers={fantasyPlayers}
          existingTeamPlayerIds={existingTeam.players.map((p) => p.steam_id)}
          currentBudget={existingTeam.budget_remaining}
          substitutionsRemaining={substitutionsRemaining}
          onConfirmSubstitution={handleConfirmSubstitution}
          isSubmitting={isSubmitting}
        />

        {/* Role Assignment Dialog */}
        <RoleAssignmentDialog
          open={roleDialogOpen}
          onOpenChange={(open) => {
            setRoleDialogOpen(open);
            if (!open) {
              setTempRoles({});
            }
          }}
          players={existingTeam.players.map((p) => ({
            id: p.steam_id,
            name: p.nickname,
            team: p.team_name || "Free Agent",
            role: p.role || undefined
          }))}
          currentPlayerIndex={currentRolePlayerIndex}
          onRoleSelect={handleRoleSelect}
          onNavigate={(direction) => {
            if (direction === "next") {
              setCurrentRolePlayerIndex(
                Math.min(
                  currentRolePlayerIndex + 1,
                  existingTeam.players.length - 1
                )
              );
            } else {
              setCurrentRolePlayerIndex(
                Math.max(currentRolePlayerIndex - 1, 0)
              );
            }
          }}
          autoAdvance={true}
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

  return (
    <div className="container mx-auto py-6 space-y-6">
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
              <Select
                value={selectedLeagueId}
                onValueChange={setSelectedLeagueId}
              >
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue
                    placeholder={
                      isLoadingLeagues ? "Loading..." : "Choose a league"
                    }
                  />
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
        onRemovePlayer={handleRemovePlayer}
        onFinalize={handleFinalizeTeam}
        budgetRemaining={budgetRemaining}
        teamName={teamName}
        onTeamNameChange={handleTeamNameChange}
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
                      setFilterTier(value as PlayerTier | "all")
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
                      setSortBy(value as "value" | "name" | "rating")
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
