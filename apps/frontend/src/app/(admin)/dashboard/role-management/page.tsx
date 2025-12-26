"use client";

import { useState } from "react";
import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SteamIdInput } from "@/components/ui/steam-id-input";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { useUsersWithRole } from "@/hooks/data/dashboard/useRoleUsers";
import { useRoleActions } from "@/hooks/data/dashboard/useRoleActions";
import { useManageableRoles } from "@/hooks/data/dashboard/useManageableRoles";
import { useAllSeasons } from "@/hooks/data/useAllSeasons";
import { useTeamsForSeason } from "@/hooks/data/dashboard/useTeamsForSeason";
import { useCheckCaptain } from "@/hooks/data/dashboard/useCheckCaptain";

export default function RoleManagementPage() {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [steamId, setSteamId] = useState<string>("");
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [success, setSuccess] = useState<string | null>(null);

  // Get manageable roles for the current user
  const { roles: manageableRoles, isLoading: isLoadingRoles } =
    useManageableRoles();

  // Get users with the selected role
  const {
    users,
    isLoading: isLoadingUsers,
    mutate: refetchUsers
  } = useUsersWithRole(selectedRole);

  // Role actions hook
  const {
    addRole,
    removeRole,
    isLoading: isActionLoading,
    error,
    clearError
  } = useRoleActions();

  // Seasons for captain/co-captain roles
  const { seasons, isLoading: isLoadingSeasons } = useAllSeasons();

  // Teams for selected season
  const { teams, isLoading: isLoadingTeams } = useTeamsForSeason(
    selectedSeasonId || null
  );

  // Check for existing captain when season and team are selected
  const { existingCaptain, isLoading: isCheckingCaptain } = useCheckCaptain(
    selectedSeasonId || null,
    selectedTeamId || null,
    selectedRole
  );

  // Helper to determine if role is captain or co-captain
  const isCaptainRole =
    selectedRole === "captain" || selectedRole === "co-captain";

  const handleAddRole = async () => {
    if (!steamId || !selectedRole) return;

    // Validate season/team pairing
    if (selectedSeasonId && !selectedTeamId) {
      return;
    }

    setSuccess(null);
    clearError();

    try {
      await addRole(
        steamId,
        selectedRole,
        selectedSeasonId || undefined,
        selectedTeamId || undefined
      );
      setSuccess(
        selectedSeasonId && selectedTeamId
          ? `${selectedRole} role assigned to team successfully`
          : `${selectedRole} role added successfully`
      );
      setSteamId(""); // Clear the input
      setSelectedSeasonId(""); // Clear season
      setSelectedTeamId(""); // Clear team
      refetchUsers(); // Refresh the user list
    } catch (err) {
      // Error is handled by the hook
      console.error("Failed to add role:", err);
    }
  };

  const handleRemoveRole = async (steamId: string) => {
    if (!selectedRole) return;

    setSuccess(null);
    clearError();

    try {
      await removeRole(steamId, selectedRole);
      setSuccess(`${selectedRole} role removed successfully`);
      refetchUsers(); // Refresh the user list
    } catch (err) {
      // Error is handled by the hook
      console.error("Failed to remove role:", err);
    }
  };

  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
    setSelectedSeasonId(""); // Clear season when role changes
    setSelectedTeamId(""); // Clear team when role changes
    setSuccess(null);
    clearError();
  };

  const handleSeasonChange = (value: string) => {
    setSelectedSeasonId(value);
    setSelectedTeamId(""); // Clear team when season changes
    setSuccess(null);
    clearError();
  };

  const handleTeamChange = (value: string) => {
    setSelectedTeamId(value);
    setSuccess(null);
    clearError();
  };

  const handleSteamIdChange = (value: string) => {
    setSteamId(value);
    setSuccess(null);
    clearError();
  };

  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <div className="flex flex-1 flex-col gap-6 p-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground">
            Manage user roles and permissions
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Add Role Form */}
          <Card>
            <CardHeader>
              <CardTitle>Add Role</CardTitle>
              <CardDescription>
                Add a role to a user by entering their Steam ID
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={selectedRole}
                  onValueChange={handleRoleChange}
                  disabled={isLoadingRoles}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role to manage" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingRoles ? (
                      <SelectItem value="loading" disabled>
                        Loading roles...
                      </SelectItem>
                    ) : manageableRoles.length > 0 ? (
                      manageableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-roles" disabled>
                        No roles available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Season Selection (only for captain/co-captain) */}
              {isCaptainRole && (
                <div className="space-y-2">
                  <Label htmlFor="season">Season (Optional)</Label>
                  <Select
                    value={selectedSeasonId}
                    onValueChange={handleSeasonChange}
                    disabled={isLoadingSeasons}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a season (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingSeasons ? (
                        <SelectItem value="loading" disabled>
                          Loading seasons...
                        </SelectItem>
                      ) : seasons && seasons.length > 0 ? (
                        seasons.map((season) => (
                          <SelectItem
                            key={season.id}
                            value={season.id.toString()}
                          >
                            {season.full_name || `Season ${season.id}`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-seasons" disabled>
                          No seasons available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Select season to assign {selectedRole} to a specific team
                  </p>
                </div>
              )}

              {/* Team Selection (only when season is selected) */}
              {isCaptainRole && selectedSeasonId && (
                <div className="space-y-2">
                  <Label htmlFor="team">Team</Label>
                  <Select
                    value={selectedTeamId}
                    onValueChange={handleTeamChange}
                    disabled={isLoadingTeams}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingTeams ? (
                        <SelectItem value="loading" disabled>
                          Loading teams...
                        </SelectItem>
                      ) : teams && teams.length > 0 ? (
                        teams.map((team) => (
                          <SelectItem
                            key={team.team_id}
                            value={team.team_id.toString()}
                          >
                            {team.team_name} ({team.league_name})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-teams" disabled>
                          No teams available for this season
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Required when season is selected
                  </p>
                </div>
              )}

              {/* Warning Alert for Existing Captain */}
              {isCaptainRole &&
                selectedSeasonId &&
                selectedTeamId &&
                existingCaptain &&
                !isCheckingCaptain && (
                  <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-900/20">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-amber-700 dark:text-amber-300">
                      <strong>{existingCaptain.nickname}</strong> (Steam ID:{" "}
                      {existingCaptain.steam_id}) is currently the{" "}
                      {selectedRole} of this team. Adding this role will replace
                      them.
                    </AlertDescription>
                  </Alert>
                )}

              {/* Steam ID Input */}
              <SteamIdInput
                id="steamId"
                value={steamId}
                onChange={handleSteamIdChange}
                label="Steam ID"
                placeholder="Enter Steam ID (e.g., 76561198000000001)"
                convertOnBlur={true}
              />

              {/* Add Role Button */}
              <Button
                onClick={handleAddRole}
                disabled={
                  !selectedRole ||
                  !steamId ||
                  isActionLoading ||
                  Boolean(selectedSeasonId && !selectedTeamId)
                }
                className="w-full"
              >
                {isActionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Role...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Role
                  </>
                )}
              </Button>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {success && (
                <Alert
                  variant="default"
                  className="border-green-500 bg-green-50 dark:bg-green-900/20"
                >
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    {success}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle>
                Users with{" "}
                {selectedRole
                  ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)
                  : "Selected"}{" "}
                Role
              </CardTitle>
              <CardDescription>
                {selectedRole
                  ? `Manage users with ${selectedRole} role`
                  : "Select a role to view users"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedRole ? (
                <div className="text-center text-muted-foreground py-8">
                  Select a role to view users
                </div>
              ) : isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading users...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No users found with {selectedRole} role
                </div>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.account_id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="font-medium">{user.nickname}</div>
                          <div className="text-sm text-muted-foreground">
                            Steam ID: {user.steam_id}
                          </div>
                        </div>
                        <Badge variant="secondary">{selectedRole}</Badge>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveRole(user.steam_id)}
                        disabled={isActionLoading}
                      >
                        {isActionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </WithRoleProtection>
  );
}
