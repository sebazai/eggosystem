"use client";

import { useState, useCallback, useEffect } from "react";
import useSWR from "swr";
import { useDashboardSeason } from "@/hooks/data/dashboard/useDashboardSeason";
import { SelectedSeasonBadge } from "@/components/dashboard/SelectedSeasonBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientApiFetch } from "@/lib/apiClient";
import { toast } from "sonner";

interface LeagueOption {
  league_id: number;
  league_name: string;
  tier: number;
}

interface TeamSeedRow {
  team_id: number;
  team_name: string;
  playoff_seed: number | null;
}

async function fetcher<T>(url: string): Promise<T> {
  return clientApiFetch<T>(url);
}

export function PlayoffSeedsClient() {
  const { selectedSeasonId } = useDashboardSeason();
  const seasonId = selectedSeasonId ? Number(selectedSeasonId) : null;
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const [localSeeds, setLocalSeeds] = useState<Map<number, number>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  const {
    data: leagues = [],
    isLoading: isLoadingLeagues,
    error: leaguesError
  } = useSWR<LeagueOption[]>(
    seasonId
      ? `/api/v1/dashboard/playoff-seeds/season/${seasonId}/leagues`
      : null,
    (url: string) => fetcher<LeagueOption[]>(url)
  );

  // Reset league when season changes so dropdown reflects the selected season
  useEffect(() => {
    setSelectedLeagueId("");
  }, [seasonId]);

  // Clear league selection if it's not in the current leagues list
  const leagueId = selectedLeagueId ? Number(selectedLeagueId) : null;
  const leagueIdValid =
    leagueId != null && leagues.some((l) => l.league_id === leagueId);
  const effectiveLeagueId = leagueIdValid ? leagueId : null;

  useEffect(() => {
    if (leagues.length > 0 && selectedLeagueId && !leagueIdValid) {
      setSelectedLeagueId("");
    }
  }, [leagues, selectedLeagueId, leagueIdValid]);
  const { data: teams = [], mutate: mutateTeams } = useSWR<TeamSeedRow[]>(
    seasonId && effectiveLeagueId
      ? `/api/v1/dashboard/playoff-seeds/season/${seasonId}/league/${effectiveLeagueId}`
      : null,
    (url: string) => fetcher<TeamSeedRow[]>(url),
    {
      onSuccess: (data) => {
        const next = new Map<number, number>();
        data.forEach((t) => {
          if (t.playoff_seed != null) next.set(t.team_id, t.playoff_seed);
        });
        setLocalSeeds(next);
      }
    }
  );

  const handleSeedChange = useCallback((teamId: number, value: string) => {
    const num = value === "" ? 0 : parseInt(value, 10);
    setLocalSeeds((prev) => {
      const next = new Map(prev);
      if (Number.isFinite(num) && num >= 1) {
        next.set(teamId, num);
      } else {
        next.delete(teamId);
      }
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!seasonId || !effectiveLeagueId) return;
    setIsSaving(true);
    try {
      const seeds = Array.from(localSeeds.entries())
        .filter(([, seed]) => seed >= 1)
        .map(([team_id, playoff_seed]) => ({ team_id, playoff_seed }));
      const updated = await clientApiFetch<TeamSeedRow[]>(
        `/api/v1/dashboard/playoff-seeds/season/${seasonId}/league/${effectiveLeagueId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seeds })
        }
      );
      await mutateTeams(updated, false);
      toast.success("Playoff seeds saved.");
    } catch (_e) {
      toast.error("Failed to save playoff seeds.");
    } finally {
      setIsSaving(false);
    }
  }, [seasonId, effectiveLeagueId, localSeeds, mutateTeams]);

  const showTeams = seasonId != null && effectiveLeagueId != null;
  const hasChanges =
    teams.length > 0 &&
    teams.some((t) => {
      const current = t.playoff_seed ?? null;
      const local = localSeeds.get(t.team_id) ?? null;
      return current !== local;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <SelectedSeasonBadge />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Playoff seeds</CardTitle>
          <CardDescription>
            Use the season from the dashboard sidebar (left nav). Select a
            league, then set each team’s seed (1–16). Round 1 bracket order
            follows these seeds.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!seasonId ? (
            <p className="text-muted-foreground text-sm">
              Select a season in the dashboard sidebar (left nav) to load
              leagues.
            </p>
          ) : leaguesError ? (
            <p className="text-destructive text-sm">
              Failed to load leagues.{" "}
              {leaguesError instanceof Error
                ? leaguesError.message
                : "Try again or check your permissions."}
            </p>
          ) : isLoadingLeagues ? (
            <Spinner />
          ) : leagues.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No leagues for this season in SeasonLeagues. Add leagues (e.g.
              Sortter → Finalize or Season League Mapper) first.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label>League</Label>
                <Select
                  value={selectedLeagueId}
                  onValueChange={setSelectedLeagueId}
                >
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Select league" />
                  </SelectTrigger>
                  <SelectContent>
                    {leagues.map((l) => (
                      <SelectItem key={l.league_id} value={String(l.league_id)}>
                        {l.league_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showTeams && (
                <>
                  {teams.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No teams in this league. Add teams via Sortter first.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-md border">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="px-4 py-2 text-left font-medium">
                                Team
                              </th>
                              <th className="w-24 px-4 py-2 text-left font-medium">
                                Seed
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {teams.map((t) => (
                              <tr
                                key={t.team_id}
                                className="border-b last:border-0"
                              >
                                <td className="px-4 py-2">{t.team_name}</td>
                                <td className="px-4 py-2">
                                  <Input
                                    type="number"
                                    min={1}
                                    max={99}
                                    placeholder="1–16"
                                    className="w-20"
                                    value={localSeeds.get(t.team_id) ?? ""}
                                    onChange={(e) =>
                                      handleSeedChange(
                                        t.team_id,
                                        e.target.value
                                      )
                                    }
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <Button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                      >
                        {isSaving ? "Saving…" : "Save seeds"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
