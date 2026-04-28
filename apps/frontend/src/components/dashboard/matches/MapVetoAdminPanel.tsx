"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  MatchVetoContext,
  MatchVetoContextTeam,
  UnfinishedMatch,
  VetoAction
} from "@eggosystem/types";
import { ApiError, clientApiFetch } from "@/lib/apiClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { useDashboardSeason } from "@/hooks/data/dashboard/useDashboardSeason";

interface UnfinishedMatchesResponse {
  matches: UnfinishedMatch[];
}

interface CreateVetoStepsResponse {
  match_id: number;
  vetoes: unknown[];
}

function labelForAction(action: VetoAction): string {
  if (action === "drop") return "Ban";
  if (action === "pick") return "Pick";
  return "Decider";
}

function teamIdForVetoOrder(
  vetoOrder: number,
  starterTeamId: number,
  teams: MatchVetoContextTeam[]
): number {
  const ids = [...teams].map((t) => t.team_id).sort((a, b) => a - b);
  const other = ids.find((id) => id !== starterTeamId);
  if (other === undefined) {
    throw new Error("Starter team must be one of the two match teams");
  }
  return vetoOrder % 2 === 1 ? starterTeamId : other;
}

function teamNameById(teams: MatchVetoContextTeam[], teamId: number): string {
  return teams.find((t) => t.team_id === teamId)?.team_name ?? `#${teamId}`;
}

export function MapVetoAdminPanel() {
  const { selectedSeasonId } = useDashboardSeason();

  const [matches, setMatches] = useState<UnfinishedMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

  const [selectedMatchId, setSelectedMatchId] = useState<string>("");

  const [context, setContext] = useState<MatchVetoContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);

  const [starterTeamId, setStarterTeamId] = useState<number | null>(null);
  const [draftSelections, setDraftSelections] = useState<
    Record<number, number>
  >({});

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"clear" | "submit" | null>(null);

  const loadUnfinished = useCallback(async () => {
    if (!selectedSeasonId) {
      setMatches([]);
      return;
    }

    setMatchesLoading(true);
    setError(null);
    try {
      const data = await clientApiFetch<UnfinishedMatchesResponse>(
        `/api/v1/dashboard/matches/unfinished/${selectedSeasonId}`
      );
      setMatches(data.matches ?? []);
    } catch (err) {
      setMatches([]);
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
      } else {
        setError("Could not load unfinished matches.");
      }
    } finally {
      setMatchesLoading(false);
    }
  }, [selectedSeasonId]);

  useEffect(() => {
    void loadUnfinished();
  }, [loadUnfinished]);

  const loadContext = useCallback(async (matchId: number) => {
    setContextLoading(true);
    setError(null);
    setSuccessMessage(null);
    setStarterTeamId(null);
    setDraftSelections({});
    try {
      const data = await clientApiFetch<MatchVetoContext>(
        `/api/v1/dashboard/matches/${matchId}/veto-context`
      );
      setContext(data);
    } catch (err) {
      setContext(null);
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
      } else {
        setError("Could not load veto context.");
      }
    } finally {
      setContextLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = Number.parseInt(selectedMatchId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      setContext(null);
      return;
    }
    void loadContext(id);
  }, [selectedMatchId, loadContext]);

  const templateSteps = useMemo(
    () => context?.template?.steps ?? [],
    [context?.template]
  );
  const totalSteps = templateSteps.length;

  const nextOrderToFill = useMemo(() => {
    for (const s of templateSteps) {
      if (draftSelections[s.order] === undefined) return s.order;
    }
    return null;
  }, [draftSelections, templateSteps]);

  const currentTemplateStep = useMemo(() => {
    if (nextOrderToFill === null) return null;
    return templateSteps.find((s) => s.order === nextOrderToFill) ?? null;
  }, [nextOrderToFill, templateSteps]);

  const usedMapIds = useMemo(
    () => new Set(Object.values(draftSelections)),
    [draftSelections]
  );

  const draftComplete =
    starterTeamId !== null &&
    totalSteps > 0 &&
    Object.keys(draftSelections).length === totalSteps &&
    usedMapIds.size === totalSteps;

  function handlePickMap(mapId: number) {
    if (
      starterTeamId === null ||
      nextOrderToFill === null ||
      context === null
    ) {
      return;
    }
    setDraftSelections((prev) => ({ ...prev, [nextOrderToFill]: mapId }));
  }

  function handleDraftBack() {
    const filledOrders = Object.keys(draftSelections)
      .map((k) => Number.parseInt(k, 10))
      .sort((a, b) => b - a);
    const lastFilled = filledOrders[0];
    if (lastFilled !== undefined) {
      setDraftSelections((prev) => {
        const next = { ...prev };
        delete next[lastFilled];
        return next;
      });
      return;
    }
    if (starterTeamId !== null) {
      setStarterTeamId(null);
    }
  }

  async function submitDraft() {
    if (
      !context ||
      starterTeamId === null ||
      !draftComplete ||
      templateSteps.length === 0
    ) {
      return;
    }

    setBusyAction("submit");
    setError(null);
    setSuccessMessage(null);

    try {
      const steps = templateSteps.map((s) => ({
        team_id: teamIdForVetoOrder(s.order, starterTeamId, context.teams),
        map_id: draftSelections[s.order],
        veto_order: s.order
      }));

      for (const s of steps) {
        if (typeof s.map_id !== "number" || !Number.isFinite(s.map_id)) {
          setError("Each veto step needs a map.");
          return;
        }
      }

      await clientApiFetch<CreateVetoStepsResponse>(
        `/api/v1/dashboard/matches/${context.match_id}/vetoes`,
        {
          method: "POST",
          body: JSON.stringify({ steps })
        }
      );

      setSuccessMessage("Map veto recorded.");
      await loadContext(context.match_id);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
      } else {
        setError("Could not save veto steps.");
      }
    } finally {
      setBusyAction(null);
    }
  }

  async function clearVetoes() {
    if (!context) return;
    setBusyAction("clear");
    setError(null);
    setSuccessMessage(null);
    try {
      await clientApiFetch(
        `/api/v1/dashboard/matches/${context.match_id}/vetoes`,
        {
          method: "DELETE"
        }
      );
      setSuccessMessage("Veto entries cleared.");
      await loadContext(context.match_id);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
      } else {
        setError("Could not clear vetoes.");
      }
    } finally {
      setBusyAction(null);
    }
  }

  const seasonMissingMessage =
    !selectedSeasonId &&
    "Pick a season in the sidebar to list unfinished matches for that season.";

  const sortedTeams =
    context !== null
      ? [...context.teams].sort((a, b) => a.team_id - b.team_id)
      : [];

  const starterChoices =
    sortedTeams.length >= 2 ? sortedTeams.slice(0, 2) : sortedTeams;

  const vetoesRecorded =
    context !== null &&
    Array.isArray(context.vetoes) &&
    context.vetoes.length > 0;

  const teamCountInvalid = context !== null && context.teams.length !== 2;

  const poolTooSmall =
    context !== null &&
    context.template !== null &&
    context.map_pool.length < totalSteps;

  const showDraftUi =
    context !== null &&
    context.template !== null &&
    !vetoesRecorded &&
    totalSteps > 0 &&
    !teamCountInvalid &&
    !poolTooSmall;

  const filledStepCount = Object.keys(draftSelections).length;

  return (
    <div className="flex flex-col gap-6">
      {seasonMissingMessage ? (
        <Alert>
          <AlertDescription>{seasonMissingMessage}</AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {successMessage ? (
        <Alert>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg sm:text-xl">Match</CardTitle>
          <CardDescription>
            Unfinished matches for the selected season. Labels follow{" "}
            <span className="font-medium">League Team A vs. Team B</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="text-sm font-medium">Season-aware selection</div>
            <Select
              value={selectedMatchId}
              onValueChange={(value) => {
                setSelectedMatchId(value);
              }}
              disabled={!selectedSeasonId || matchesLoading}
            >
              <SelectTrigger className="w-full min-h-11 md:max-w-xl">
                <SelectValue
                  placeholder={
                    matchesLoading
                      ? "Loading matches…"
                      : "Select an unfinished match"
                  }
                />
              </SelectTrigger>
              <SelectContent position="popper">
                {matches.map((m) => (
                  <SelectItem
                    key={m.match_id}
                    value={String(m.match_id)}
                    textValue={m.label}
                  >
                    <span className="line-clamp-2 text-left">{m.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSeasonId && !matchesLoading && matches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No unfinished matches for this season.
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full shrink-0 sm:w-auto"
            onClick={() => void loadUnfinished()}
            disabled={!selectedSeasonId || matchesLoading}
          >
            Refresh list
          </Button>
        </CardContent>
      </Card>

      {selectedMatchId && contextLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Spinner size="sm" />
          <span>Loading veto context…</span>
        </div>
      ) : null}

      {context && !contextLoading ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              Match details & map pool
            </CardTitle>
            <CardDescription>
              Metadata and active map pool (SeasonActiveMapPool) for this match.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium">{context.status}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Format</dt>
                <dd className="font-medium">BO{context.best_of}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Teams</dt>
                <dd className="font-medium">
                  {context.teams.map((t) => t.team_name).join(" vs. ")}
                </dd>
              </div>
            </dl>

            <div>
              <div className="mb-2 text-sm font-medium">Map pool</div>
              <ul className="flex flex-wrap gap-2">
                {context.map_pool.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-md border bg-muted/40 px-2 py-1 text-sm"
                  >
                    {m.name}
                  </li>
                ))}
              </ul>
              {context.map_pool.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No maps in the active pool for this season — vetoes cannot be
                  recorded until maps are configured.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {context && !contextLoading && context.template === null ? (
        <Alert variant="destructive">
          <AlertDescription>
            No veto template is registered for BO{context.best_of}. Only BO1,
            BO3, and BO5 are supported for manual entry.
          </AlertDescription>
        </Alert>
      ) : null}

      {context && !contextLoading && teamCountInvalid ? (
        <Alert variant="destructive">
          <AlertDescription>
            This match needs exactly two teams in MatchTeams before vetoes can
            be recorded.
          </AlertDescription>
        </Alert>
      ) : null}

      {context && !contextLoading && poolTooSmall ? (
        <Alert variant="destructive">
          <AlertDescription>
            The active map pool has fewer maps ({context.map_pool.length}) than
            veto steps ({totalSteps}). Add maps to the season pool first.
          </AlertDescription>
        </Alert>
      ) : null}

      {context &&
      !contextLoading &&
      vetoesRecorded &&
      context.template !== null ? (
        <Card>
          <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg sm:text-xl">
                Recorded veto sequence
              </CardTitle>
              <CardDescription>
                Stored veto rows for this match (BO{context.best_of}).
              </CardDescription>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full shrink-0 sm:w-auto"
                  disabled={busyAction !== null}
                >
                  {busyAction === "clear" ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : null}
                  Clear vetoes
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all veto rows?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes every recorded map veto for this match so you
                    can start over. This cannot be undone except by re-entering
                    vetoes.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void clearVetoes()}>
                    Clear
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">#</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Map</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {context.vetoes.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>{v.veto_order}</TableCell>
                    <TableCell>{v.team_name}</TableCell>
                    <TableCell>{labelForAction(v.action)}</TableCell>
                    <TableCell>{v.map_name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {showDraftUi ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              Admin veto flow (BO{context.best_of})
            </CardTitle>
            <CardDescription>
              Choose which team performs the first veto, then complete each step
              in order. Submit sends one request with the full sequence.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="text-sm font-medium">
                Vote starter (first veto)
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                {starterChoices.map((t) => (
                  <Button
                    key={t.team_id}
                    type="button"
                    variant={
                      starterTeamId === t.team_id ? "default" : "outline"
                    }
                    className="min-h-11 flex-1 justify-center sm:flex-none"
                    onClick={() => {
                      setStarterTeamId(t.team_id);
                      setDraftSelections({});
                    }}
                  >
                    {t.team_name}
                  </Button>
                ))}
              </div>
              {starterTeamId === null ? (
                <p className="text-sm text-muted-foreground">
                  Pick which side corresponds to the first ban on the template.
                </p>
              ) : null}
            </div>

            {starterTeamId !== null &&
            currentTemplateStep !== null &&
            context !== null ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="text-sm font-medium">
                    Step {filledStepCount + 1} of {totalSteps}:{" "}
                    {labelForAction(currentTemplateStep.action)} —{" "}
                    {teamNameById(
                      context.teams,
                      teamIdForVetoOrder(
                        currentTemplateStep.order,
                        starterTeamId,
                        context.teams
                      )
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto min-h-9 px-2 py-1"
                    onClick={handleDraftBack}
                  >
                    Back
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {context.map_pool.map((m) => {
                    const disabled = usedMapIds.has(m.id);
                    return (
                      <Button
                        key={m.id}
                        type="button"
                        variant={disabled ? "ghost" : "outline"}
                        disabled={disabled}
                        className="min-h-11 w-full justify-center px-2 text-center text-sm font-normal leading-snug"
                        onClick={() => handlePickMap(m.id)}
                      >
                        {m.name}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {starterTeamId !== null &&
            draftComplete &&
            context !== null &&
            nextOrderToFill === null ? (
              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  className="min-h-11 w-full sm:w-auto"
                  disabled={busyAction !== null}
                  onClick={() => void submitDraft()}
                >
                  {busyAction === "submit" ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : null}
                  Submit veto sequence
                </Button>
                <p className="text-sm text-muted-foreground">
                  All {totalSteps} steps filled with distinct maps from the
                  pool.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
