"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

import { useAllSeasons } from "@/hooks/data/useAllSeasons";
import { usePlayerValidation } from "@/hooks/data/dashboard/usePlayerValidation";
import { PlayerValidationDisplay } from "@/components/dashboard/PlayerValidationDisplay";
import { PlayerValidationForm } from "@/components/dashboard/PlayerValidationForm";
import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";

export default function PlayerValidationPage() {
  const searchParams = useSearchParams();
  // Initialize state from URL params using lazy initialization
  const [steamId, setSteamId] = useState(
    () => searchParams?.get("steamId") || ""
  );
  const [seasonId, setSeasonId] = useState(
    () => searchParams?.get("seasonId") || ""
  );
  const [success, setSuccess] = useState<string | null>(null);

  // Get all seasons
  const { seasons, isLoading: isLoadingSeasons } = useAllSeasons();

  // Sync state when URL params change - use a ref to track previous values
  const urlSteamId = searchParams?.get("steamId");
  const urlSeasonId = searchParams?.get("seasonId");
  const prevUrlSteamIdRef = useRef(urlSteamId);
  const prevUrlSeasonIdRef = useRef(urlSeasonId);

  useEffect(() => {
    if (urlSteamId && urlSteamId !== prevUrlSteamIdRef.current) {
      prevUrlSteamIdRef.current = urlSteamId;
      if (urlSteamId !== steamId) {
        setSteamId(urlSteamId);
      }
    }
    if (urlSeasonId && urlSeasonId !== prevUrlSeasonIdRef.current) {
      prevUrlSeasonIdRef.current = urlSeasonId;
      if (urlSeasonId !== seasonId) {
        setSeasonId(urlSeasonId);
      }
    }
  }, [urlSteamId, urlSeasonId, steamId, seasonId]);

  // Player validation hook
  const {
    validationResult,
    isValidating,
    error,
    validatePlayer,
    clearResults
  } = usePlayerValidation();

  // Set platform when season changes - calculate during render (React best practice)
  const selectedSeason = seasonId
    ? seasons?.find((s) => s.id.toString() === seasonId)
    : null;
  const platform = selectedSeason?.platform ?? null;

  const handleValidation = async () => {
    setSuccess(null);
    await validatePlayer(steamId, seasonId);
  };

  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
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
              <PlayerValidationForm
                steamId={steamId}
                setSteamId={(value) => {
                  setSteamId(value);
                  clearResults(); // Clear when Steam ID changes
                  setSuccess(null);
                }}
                seasonId={seasonId}
                setSeasonId={(value) => {
                  setSeasonId(value);
                  clearResults(); // Clear when season changes
                  setSuccess(null);
                  // Platform is calculated during render, no need to set it here
                }}
                seasons={seasons}
                isLoadingSeasons={isLoadingSeasons}
                isValidating={isValidating}
                error={error}
                success={success}
                onValidate={handleValidation}
                disabled={!platform}
              />
            </div>
          </CardContent>
        </Card>

        {validationResult && (
          <PlayerValidationDisplay
            validationResult={validationResult}
            platform={platform}
            variant="detailed"
          />
        )}
      </div>
    </WithRoleProtection>
  );
}
