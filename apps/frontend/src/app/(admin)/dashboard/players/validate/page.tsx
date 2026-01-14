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

import { useDashboardSeason } from "@/hooks/data/dashboard/useDashboardSeason";
import { usePlayerValidation } from "@/hooks/data/dashboard/usePlayerValidation";
import { PlayerValidationDisplay } from "@/components/dashboard/PlayerValidationDisplay";
import { PlayerValidationForm } from "@/components/dashboard/PlayerValidationForm";
import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { SelectedSeasonBadge } from "@/components/dashboard/SelectedSeasonBadge";

export default function PlayerValidationPage() {
  const searchParams = useSearchParams();
  const { selectedSeasonId } = useDashboardSeason();

  // Initialize state from URL params using lazy initialization
  const [steamId, setSteamId] = useState(
    () => searchParams?.get("steamId") || ""
  );
  const [success, setSuccess] = useState<string | null>(null);

  // Use shared season from URL, fallback to seasonId param for backward compatibility
  const seasonId = selectedSeasonId || searchParams?.get("seasonId") || "";

  // Sync state when URL params change - use a ref to track previous values
  const urlSteamId = searchParams?.get("steamId");
  const prevUrlSteamIdRef = useRef(urlSteamId);

  useEffect(() => {
    if (urlSteamId && urlSteamId !== prevUrlSteamIdRef.current) {
      prevUrlSteamIdRef.current = urlSteamId;
      if (urlSteamId !== steamId) {
        setSteamId(urlSteamId);
      }
    }
  }, [urlSteamId, steamId]);

  // Player validation hook
  const {
    validationResult,
    isValidating,
    error,
    validatePlayer,
    clearResults
  } = usePlayerValidation();

  // Get platform from validation result (inferred from backend) or null if not yet validated
  const platform = validationResult?.platform ?? null;

  const handleValidation = async () => {
    setSuccess(null);
    await validatePlayer(steamId, seasonId);
  };

  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Player Validation</h1>
            <SelectedSeasonBadge />
          </div>
          <p className="text-muted-foreground">
            Validate player data before adding them to teams. This checks hours,
            ranks, platform ranks, and Kanahub profile. Platform and game are
            automatically determined from the selected season.
          </p>
        </div>

        {!selectedSeasonId && (
          <Card>
            <CardHeader>
              <CardTitle>Season Required</CardTitle>
              <CardDescription>
                Please select a season from the sidebar to validate players.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {selectedSeasonId && (
          <Card>
            <CardHeader>
              <CardTitle>Validation Parameters</CardTitle>
              <CardDescription>
                Enter the player&apos;s Steam ID to validate their data for the
                selected season
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
                  setSeasonId={() => {
                    // Season is managed by shared selector, but we can still clear results
                    clearResults();
                    setSuccess(null);
                  }}
                  seasons={[]}
                  isLoadingSeasons={false}
                  isValidating={isValidating}
                  error={error}
                  success={success}
                  onValidate={handleValidation}
                  disabled={!selectedSeasonId}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {validationResult && selectedSeasonId && (
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
