"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { isValidSteamId } from "@/lib/utils";
import { clientApiFetch } from "@/lib/apiClient";
import { SeasonPlatform } from "@eggosystem/types";
import type { PlayerValidationResult } from "@eggosystem/types";
import { FaceITLevelIcon } from "@/components/profile/FaceITLevelIcon";
import { CS2PremierRankBadge } from "@/components/profile/CS2PremierRankBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAllSeasons } from "@/hooks/data/useAllSeasons";

export default function PlayerValidationPage() {
  const [steamId, setSteamId] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [platform, setPlatform] = useState<SeasonPlatform | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] =
    useState<PlayerValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get all seasons
  const { seasons, isLoading: isLoadingSeasons } = useAllSeasons();

  // Clear results when season changes
  useEffect(() => {
    if (seasonId) {
      setValidationResult(null);
      setError(null);
      setSuccess(null);

      // Set platform from selected season
      const selectedSeason = seasons?.find((s) => s.id.toString() === seasonId);
      if (selectedSeason) {
        setPlatform(selectedSeason.platform);
      }
    }
  }, [seasonId, seasons]);

  const handleValidation = async () => {
    if (!steamId || !seasonId || !platform) {
      setError("All fields are required. Please select a season first.");
      return;
    }

    if (!isValidSteamId(steamId)) {
      setError("Invalid Steam ID format");
      return;
    }

    setIsValidating(true);
    setError(null);
    setSuccess(null);
    setValidationResult(null);

    try {
      const result = await clientApiFetch<PlayerValidationResult>(
        `/api/v1/dashboard/players/${steamId}/validate?season_id=${seasonId}`
      );
      setValidationResult(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to validate player"
      );
    } finally {
      setIsValidating(false);
    }
  };

  console.log(validationResult);

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge variant="default" className="bg-green-500">
        Valid
      </Badge>
    ) : (
      <Badge variant="destructive">Invalid</Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Player Validation</h1>
        <p className="text-muted-foreground">
          Validate player data before adding them to teams. This checks hours,
          ranks, platform ranks, and Kanahub profile. Platform and game are
          automatically determined from the selected season.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Validation Parameters</CardTitle>
          <CardDescription>
            Enter the player&apos;s Steam ID and season details to validate
            their data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="steamId">Steam ID</Label>
              <Input
                id="steamId"
                placeholder="76561198012345678"
                value={steamId}
                onChange={(e) => setSteamId(e.target.value)}
                disabled={isValidating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="season">Season</Label>
              <Select
                value={seasonId}
                onValueChange={setSeasonId}
                disabled={isValidating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a season" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingSeasons ? (
                    <SelectItem value="loading" disabled>
                      Loading seasons...
                    </SelectItem>
                  ) : seasons && seasons.length > 0 ? (
                    seasons
                      .sort((a, b) => b.id - a.id)
                      .map((season) => (
                        <SelectItem
                          key={season.id}
                          value={season.id.toString()}
                        >
                          {season.full_name}
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem value="no-seasons" disabled>
                      No seasons available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleValidation}
            disabled={isValidating || !steamId || !seasonId || !platform}
            className="w-full"
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              "Validate Player"
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert
              variant="default"
              className="bg-green-50 border-green-200 text-green-800"
            >
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {validationResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Validation Results</CardTitle>
              {getStatusBadge(validationResult.overall_success)}
            </div>
            <CardDescription>
              Steam ID: {validationResult.steam_id} | Season:{" "}
              {validationResult.season_id} | Platform: {platform}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hours Validation */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(validationResult.hours.success)}
                <div>
                  <h4 className="font-medium">Steam Hours</h4>
                  <p className="text-sm text-muted-foreground">
                    {validationResult.hours.success
                      ? `${validationResult.hours.value} hours`
                      : "Could not determine hours"}
                  </p>
                </div>
              </div>
              {getStatusBadge(validationResult.hours.success)}
            </div>

            {/* Rank Validation */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(validationResult.rank.success)}
                <div>
                  <h4 className="font-medium">CS2 Rank</h4>
                  <p className="text-sm text-muted-foreground">
                    {validationResult.rank.success
                      ? `Rank: ${validationResult.rank.value}`
                      : "Could not determine rank"}
                  </p>
                </div>
                {validationResult.rank.success && (
                  <CS2PremierRankBadge
                    rankScore={validationResult.rank.value}
                  />
                )}
              </div>
              {getStatusBadge(validationResult.rank.success)}
            </div>

            {/* Platform Rank Validation */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(validationResult.platform_rank.success)}
                <div>
                  <h4 className="font-medium">{platform} Rank</h4>
                  <p className="text-sm text-muted-foreground">
                    {validationResult.platform_rank.success
                      ? `Level: ${validationResult.platform_rank.value}`
                      : "Could not determine platform rank"}
                  </p>
                </div>
                {validationResult.platform_rank.success &&
                  platform === SeasonPlatform.FACEIT && (
                    <FaceITLevelIcon
                      level={validationResult.platform_rank.value}
                    />
                  )}
              </div>
              {getStatusBadge(validationResult.platform_rank.success)}
            </div>

            {/* Profile Validation */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(
                  Boolean(
                    validationResult.profile.success &&
                      validationResult.profile.data?.work_email_verified &&
                      validationResult.profile.data?.is_valid_full_name &&
                      validationResult.profile.data?.is_valid_work_email
                  )
                )}
                <div>
                  <h4 className="font-medium">Kanahub Profile</h4>
                  {validationResult.profile.data ? (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        Nickname:{" "}
                        {validationResult.profile.data.nickname || "Not set"}
                      </p>
                      <p>
                        Discord (captains only):{" "}
                        {validationResult.profile.data.discord || "Not set"}
                      </p>
                      <p>
                        Email Verified:{" "}
                        {validationResult.profile.data.work_email_verified
                          ? "Yes"
                          : "No"}
                      </p>
                      <p>
                        Valid Name:{" "}
                        {validationResult.profile.data.is_valid_full_name
                          ? "Yes"
                          : "No"}
                      </p>
                      <p>
                        Valid Work Email:{" "}
                        {validationResult.profile.data.is_valid_work_email
                          ? "Yes"
                          : "No"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {validationResult.profile.error || "Profile not found"}
                    </p>
                  )}
                </div>
              </div>
              {getStatusBadge(
                Boolean(
                  validationResult.profile.success &&
                    validationResult.profile.data?.work_email_verified &&
                    validationResult.profile.data?.is_valid_full_name &&
                    validationResult.profile.data?.is_valid_work_email
                )
              )}
            </div>

            {/* Overall Result */}
            <div
              className={`p-4 border rounded-lg ${
                validationResult.overall_success
                  ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                  : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
              }`}
            >
              <div className="flex items-center space-x-3">
                {validationResult.overall_success ? (
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
                <div>
                  <h4 className="font-medium">
                    {validationResult.overall_success
                      ? "Player is ready to be added to team"
                      : "Player has validation issues"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {validationResult.overall_success
                      ? "All required data is available and valid"
                      : "Some required data is missing or invalid. Please resolve issues before adding to team."}
                  </p>
                </div>
              </div>
            </div>

            {/* Validation Summary */}
            <div className="pt-4">
              {validationResult.can_add_to_team ? (
                <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/20 dark:border-green-800">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-green-800 dark:text-green-200 font-medium">
                    Player validation successful! This player can be added to
                    teams.
                  </p>
                  <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                    Use the Add Player page to add this player to a specific
                    team.
                  </p>
                </div>
              ) : (
                <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950/20 dark:border-red-800">
                  <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                  <p className="text-red-800 dark:text-red-200 font-medium">
                    Player has validation issues that need to be resolved.
                  </p>
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    Please address the issues above before adding to teams.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
