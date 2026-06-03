"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import type { ReplayGrandFinalPlacementsResponse } from "@eggosystem/types";
import { useDashboardSeason } from "@/hooks/data/dashboard/useDashboardSeason";
import { LeagueSelector } from "@/components/league/LeagueSelector";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { clientApiFetch, ApiError } from "@/lib/apiClient";
import { toast } from "sonner";

interface LeagueOption {
  league_id: number;
  league_name: string;
  tier: number;
}

function PlacementToastList({
  placements
}: {
  placements: ReplayGrandFinalPlacementsResponse["placements"];
}) {
  const sorted = [...placements].sort((a, b) => a.placement - b.placement);

  return (
    <ol className="mt-1 list-decimal list-inside space-y-0.5 text-sm">
      {sorted.map((entry) => (
        <li key={`${entry.placement}-${entry.team_id}`}>
          {entry.team_name} (team ID {entry.team_id})
        </li>
      ))}
    </ol>
  );
}

export function GrandFinalPlacementsReplaySection() {
  const { selectedSeasonId } = useDashboardSeason();
  const seasonId = selectedSeasonId ? Number(selectedSeasonId) : null;
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const {
    data: leagues = [],
    isLoading: isLoadingLeagues,
    error: leaguesError
  } = useSWR<LeagueOption[]>(
    seasonId
      ? `/api/v1/dashboard/playoff-seeds/season/${seasonId}/leagues`
      : null,
    (url: string) => clientApiFetch<LeagueOption[]>(url)
  );

  useEffect(() => {
    setSelectedLeagueId("");
    setIsConfirming(false);
  }, [seasonId]);

  const leagueId = selectedLeagueId ? Number(selectedLeagueId) : null;
  const leagueIdValid =
    leagueId != null && leagues.some((league) => league.league_id === leagueId);
  const effectiveLeagueId = leagueIdValid ? leagueId : null;

  useEffect(() => {
    if (leagues.length > 0 && selectedLeagueId && !leagueIdValid) {
      setSelectedLeagueId("");
    }
  }, [leagues, selectedLeagueId, leagueIdValid]);

  const handleReplay = async () => {
    if (seasonId == null) {
      toast.error("Select a season in the sidebar first.");
      return;
    }

    if (effectiveLeagueId == null) {
      toast.error("Select a league to replay placements.");
      return;
    }

    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    setIsConfirming(false);
    setIsLoading(true);
    try {
      const response = await clientApiFetch<ReplayGrandFinalPlacementsResponse>(
        "/api/v1/dashboard/demos/placements/replay-grand-final",
        {
          method: "POST",
          body: JSON.stringify({
            season_id: seasonId,
            league_id: effectiveLeagueId
          })
        }
      );

      if (response.applied) {
        toast.success(`Placements updated for league ${effectiveLeagueId}.`, {
          description:
            response.placements.length > 0 ? (
              <PlacementToastList placements={response.placements} />
            ) : undefined
        });
        return;
      }

      toast.warning(
        response.skipped_reason
          ? `Placements were not applied (${response.skipped_reason}).`
          : "Placements were not applied."
      );
    } catch (err) {
      console.error("Grand final placement replay failed:", err);
      if (err instanceof ApiError) {
        toast.error(err.detail || err.message);
        return;
      }
      toast.error("Failed to replay grand final placements.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelConfirm = () => {
    setIsConfirming(false);
  };

  const leagueOptions = leagues.map((league) => ({
    id: String(league.league_id),
    name: league.league_name,
    tier: league.tier
  }));

  const canReplay =
    seasonId != null &&
    effectiveLeagueId != null &&
    !isLoadingLeagues &&
    !leaguesError;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Re-apply 1st, 2nd, and 3rd place for a league grand final without
        re-uploading demos. Uses the season selected in the sidebar.
      </p>

      <div className="space-y-2">
        <Label htmlFor="gf-replay-league">League</Label>
        <LeagueSelector
          id="gf-replay-league"
          value={selectedLeagueId || null}
          onValueChange={setSelectedLeagueId}
          leagues={leagueOptions}
          placeholder={
            !seasonId
              ? "Select a season first"
              : isLoadingLeagues
                ? "Loading leagues..."
                : leaguesError
                  ? "Failed to load leagues"
                  : leagueOptions.length === 0
                    ? "No leagues for this season"
                    : "Select league"
          }
          triggerClassName="w-full"
        />
      </div>

      {isConfirming ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-destructive">
            This will overwrite existing 1st, 2nd, and 3rd place placements for
            the selected league.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleReplay}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Replaying..." : "Confirm Replay"}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancelConfirm}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={handleReplay}
          disabled={!canReplay || isLoading}
          className="w-full"
        >
          Replay Grand Final Placements
        </Button>
      )}
    </div>
  );
}
