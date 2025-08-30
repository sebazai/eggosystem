"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { SeasonPlatform } from "@eggosystem/types";
import { useAllSeasons } from "@/hooks/data/useAllSeasons";
import { usePlayerValidation } from "@/hooks/data/dashboard/usePlayerValidation";
import { PlayerValidationDisplay } from "@/components/dashboard/PlayerValidationDisplay";
import { PlayerValidationForm } from "@/components/dashboard/PlayerValidationForm";

export default function PlayerValidationPage() {
  const searchParams = useSearchParams();
  const [steamId, setSteamId] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [platform, setPlatform] = useState<SeasonPlatform | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get all seasons
  const { seasons, isLoading: isLoadingSeasons } = useAllSeasons();

  // Pre-fill form from URL parameters
  useEffect(() => {
    const urlSteamId = searchParams?.get("steamId");
    const urlSeasonId = searchParams?.get("seasonId");

    if (urlSteamId) {
      setSteamId(urlSteamId);
    }
    if (urlSeasonId) {
      setSeasonId(urlSeasonId);
    }
  }, [searchParams]);

  // Player validation hook
  const {
    validationResult,
    isValidating,
    error,
    validatePlayer,
    clearResults
  } = usePlayerValidation();

  // Set platform when season changes
  useEffect(() => {
    if (seasonId) {
      // Set platform from selected season
      const selectedSeason = seasons?.find((s) => s.id.toString() === seasonId);
      if (selectedSeason) {
        setPlatform(selectedSeason.platform);
      }
    }
  }, [seasonId, seasons]);

  const handleValidation = async () => {
    setSuccess(null);
    await validatePlayer(steamId, seasonId);
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

                // Set platform from selected season
                const selectedSeason = seasons?.find(
                  (s) => s.id.toString() === value
                );
                if (selectedSeason) {
                  setPlatform(selectedSeason.platform);
                }
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
  );
}
