"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ApiError, clientApiFetch } from "@/lib/apiClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TeamGameScoreRow {
  team_id: number;
  starting_side: "T" | "CT";
  score: number;
  halftime_score: number;
  overtime_score: number;
}

interface GetTeamGameScoresResponse {
  match_id: number;
  match_game_id: number;
  regulation_rounds: number;
  team_game_scores_staff_lock: boolean;
  match_team_ids: number[];
  teams: TeamGameScoreRow[];
}

function formatIssueMessage(issue: {
  path: (string | number)[];
  message: string;
}) {
  const cleaned = String(issue.message)
    .replace(/[\s\u00A0]+/g, " ")
    .trim();
  const path = issue.path?.length ? issue.path.join(".") : null;
  return path ? `${path}: ${cleaned}` : cleaned;
}

function normalizeTeamRows(teams: TeamGameScoreRow[]): TeamGameScoreRow[] {
  const t = teams.find((r) => r.starting_side === "T");
  const ct = teams.find((r) => r.starting_side === "CT");
  if (t && ct) return [t, ct];
  return teams;
}

function parseNonNegativeInt(input: string): number {
  if (input.trim() === "") return 0;
  const value = Number.parseInt(input, 10);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function TeamGameScoresEditor() {
  const searchParams = useSearchParams();
  const initialMatchGameId = searchParams.get("match_game_id") ?? "";

  const [matchGameId, setMatchGameId] = useState(initialMatchGameId);
  const [loaded, setLoaded] = useState<GetTeamGameScoresResponse | null>(null);
  const [editedTeams, setEditedTeams] = useState<TeamGameScoreRow[] | null>(
    null
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Array<{
    path: (string | number)[];
    message: string;
  }> | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setMatchGameId(initialMatchGameId);
  }, [initialMatchGameId]);

  const canLoad = useMemo(() => {
    const id = Number.parseInt(matchGameId, 10);
    return Number.isFinite(id) && id > 0;
  }, [matchGameId]);

  async function onLoad() {
    setError(null);
    setIssues(null);
    setSuccessMessage(null);

    const id = Number.parseInt(matchGameId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      setError("match_game_id must be a positive number");
      return;
    }

    setLoading(true);
    try {
      const data = await clientApiFetch<GetTeamGameScoresResponse>(
        `/api/v1/dashboard/matches/games/${id}/team-game-scores`
      );
      setLoaded(data);
      setEditedTeams(normalizeTeamRows(data.teams));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
        setIssues(err.issues?.length ? err.issues : null);
      } else {
        setError("Request failed");
      }
    } finally {
      setLoading(false);
    }
  }

  function setTeamValue(
    startingSide: TeamGameScoreRow["starting_side"],
    key: "score" | "halftime_score" | "overtime_score",
    value: number
  ) {
    setEditedTeams((prev) => {
      if (!prev) return prev;
      return prev.map((row) =>
        row.starting_side === startingSide ? { ...row, [key]: value } : row
      );
    });
  }

  async function onSave() {
    if (!loaded || !editedTeams) return;
    setError(null);
    setIssues(null);
    setSuccessMessage(null);

    const matchGameIdNum = loaded.match_game_id;
    if (!Number.isFinite(matchGameIdNum) || matchGameIdNum <= 0) {
      setError("match_game_id is invalid");
      return;
    }

    const t = editedTeams.find((r) => r.starting_side === "T");
    const ct = editedTeams.find((r) => r.starting_side === "CT");
    if (!t || !ct) {
      setError("Both T and CT rows are required");
      return;
    }
    for (const row of [t, ct]) {
      if (
        !Number.isFinite(row.score) ||
        !Number.isFinite(row.halftime_score) ||
        !Number.isFinite(row.overtime_score)
      ) {
        setError("Scores must be valid numbers");
        return;
      }
    }

    setSaving(true);
    try {
      const data = await clientApiFetch<GetTeamGameScoresResponse>(
        `/api/v1/dashboard/matches/games/${matchGameIdNum}/team-game-scores`,
        {
          method: "PUT",
          body: JSON.stringify({
            teams: [
              {
                team_id: t.team_id,
                starting_side: "T",
                score: t.score,
                halftime_score: t.halftime_score,
                overtime_score: t.overtime_score
              },
              {
                team_id: ct.team_id,
                starting_side: "CT",
                score: ct.score,
                halftime_score: ct.halftime_score,
                overtime_score: ct.overtime_score
              }
            ]
          })
        }
      );
      setLoaded(data);
      setEditedTeams(normalizeTeamRows(data.teams));
      setSuccessMessage("Saved");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
        setIssues(err.issues?.length ? err.issues : null);
      } else {
        setError("Request failed");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Team map scores</CardTitle>
        <CardDescription>
          Enter a match game id, load current scores, then save updates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? (
          <Alert variant="destructive" data-testid="team-game-scores-error">
            <AlertDescription>{error}</AlertDescription>
            {issues?.length ? (
              <ul className="mt-2 list-inside list-disc break-words text-sm whitespace-normal">
                {issues.map((issue, i) => (
                  <li key={i}>{formatIssueMessage(issue)}</li>
                ))}
              </ul>
            ) : null}
          </Alert>
        ) : null}

        {successMessage ? (
          <Alert data-testid="team-game-scores-success">
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="match_game_id">Match game ID</Label>
            <Input
              id="match_game_id"
              name="match_game_id"
              type="number"
              min={1}
              inputMode="numeric"
              value={matchGameId}
              onChange={(ev) => setMatchGameId(ev.target.value)}
              placeholder="e.g. 55"
              data-testid="match-game-id-input"
            />
          </div>
          <Button
            type="button"
            onClick={onLoad}
            disabled={!canLoad || loading}
            data-testid="load-team-game-scores"
          >
            {loading ? "Loading…" : "Load"}
          </Button>
        </div>

        {loaded ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Match ID{" "}
              <strong className="text-foreground">{loaded.match_id}</strong>
              {" · "}
              Regulation rounds{" "}
              <strong className="text-foreground">
                {loaded.regulation_rounds}
              </strong>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {editedTeams?.map((row) => (
                <Card key={row.starting_side}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {row.starting_side} — team {row.team_id}
                    </CardTitle>
                    <CardDescription>
                      Edit scores for the {row.starting_side} starting side.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`${row.starting_side}-score`}>
                        Score
                      </Label>
                      <Input
                        id={`${row.starting_side}-score`}
                        type="number"
                        min={0}
                        value={row.score}
                        onChange={(ev) =>
                          setTeamValue(
                            row.starting_side,
                            "score",
                            parseNonNegativeInt(ev.target.value)
                          )
                        }
                        data-testid={`${row.starting_side}-score`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${row.starting_side}-halftime-score`}>
                        Halftime score
                      </Label>
                      <Input
                        id={`${row.starting_side}-halftime-score`}
                        type="number"
                        min={0}
                        value={row.halftime_score}
                        onChange={(ev) =>
                          setTeamValue(
                            row.starting_side,
                            "halftime_score",
                            parseNonNegativeInt(ev.target.value)
                          )
                        }
                        data-testid={`${row.starting_side}-halftime-score`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${row.starting_side}-overtime-score`}>
                        Overtime score
                      </Label>
                      <Input
                        id={`${row.starting_side}-overtime-score`}
                        type="number"
                        min={0}
                        value={row.overtime_score}
                        onChange={(ev) =>
                          setTeamValue(
                            row.starting_side,
                            "overtime_score",
                            parseNonNegativeInt(ev.target.value)
                          )
                        }
                        data-testid={`${row.starting_side}-overtime-score`}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <Button
                type="button"
                onClick={onSave}
                disabled={saving || !editedTeams?.length}
                data-testid="save-team-game-scores"
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
