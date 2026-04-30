"use client";

import { useState } from "react";
import type { ManualDemoParseResponse } from "@eggosystem/types";
import { clientApiFetch, ApiError } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

export function ManualDemoParseForm() {
  const [mode, setMode] = useState<
    "external_match_room_id" | "match_game_id" | "match_id"
  >("external_match_room_id");
  const [matchGameId, setMatchGameId] = useState("");
  const [matchId, setMatchId] = useState("");
  const [mapOrder, setMapOrder] = useState("");
  const [externalMatchRoomId, setExternalMatchRoomId] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [priority, setPriority] = useState("5");
  const [reparse, setReparse] = useState(false);
  const [markFinished, setMarkFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Array<{
    path: (string | number)[];
    message: string;
  }> | null>(null);
  const [success, setSuccess] = useState<ManualDemoParseResponse | null>(null);

  const sourceLabel = mode === "external_match_room_id" ? "faceit" : "manual";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIssues(null);
    setSuccess(null);
    setSubmitting(true);

    const matchGameIdNum = Number.parseInt(matchGameId, 10);
    const matchIdNum = Number.parseInt(matchId, 10);
    const mapOrderNum = Number.parseInt(mapOrder, 10);
    const priNum = Number.parseInt(priority, 10);

    if (mode === "match_id" && !Number.isFinite(mapOrderNum)) {
      setError("map_order is required when Match ID is provided");
      setSubmitting(false);
      return;
    }

    try {
      const body = {
        ...(mode === "match_game_id"
          ? { match_game_id: matchGameIdNum }
          : mode === "match_id"
            ? {
                match_id: matchIdNum,
                map_order: mapOrderNum
              }
            : {
                external_match_room_id: externalMatchRoomId.trim()
                // No best_of needed: we infer 2xBO1 via DB state (two hub matches)
              }),
        download_url: downloadUrl.trim(),
        ...(Number.isFinite(priNum) ? { priority: priNum } : {}),
        reparse,
        mark_finished: markFinished
      };

      const data = await clientApiFetch<ManualDemoParseResponse>(
        "/api/v1/dashboard/demos/manual/parse-queue",
        {
          method: "POST",
          body: JSON.stringify(body)
        }
      );
      setSuccess(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
        if (err.issues?.length) {
          setIssues(err.issues);
        }
      } else {
        setError("Request failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Enqueue demo parse</CardTitle>
        <CardDescription>
          Paste a valid HTTPS demo download URL for a match. The job is sent to
          parse_queue with source <code className="text-xs">{sourceLabel}</code>
          .
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
              {issues?.length ? (
                <ul className="mt-2 list-inside list-disc text-sm whitespace-normal break-words">
                  {issues.map((issue, i) => (
                    <li key={i}>{formatIssueMessage(issue)}</li>
                  ))}
                </ul>
              ) : null}
            </Alert>
          ) : null}
          {success ? (
            <Alert>
              <AlertDescription className="space-y-2">
                <p>
                  Enqueued parse for match game{" "}
                  <strong>{success.match_game_id}</strong>
                </p>
                <div className="border-t pt-2 text-sm">
                  <p className="font-medium">Mark match as finished</p>
                  {success.mark_finished.applied ? (
                    <ul className="mt-1 list-inside list-disc text-muted-foreground">
                      <li>
                        Applied to match ID(s):{" "}
                        {success.mark_finished.match_ids.length
                          ? success.mark_finished.match_ids.join(", ")
                          : "—"}
                      </li>
                      <li>
                        End time (UTC):{" "}
                        {success.mark_finished.end_timestamp ?? "—"}
                      </li>
                    </ul>
                  ) : (
                    <p className="mt-1 text-muted-foreground">
                      Not applied
                      {success.mark_finished.skipped_reason
                        ? `: ${success.mark_finished.skipped_reason}`
                        : ""}
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label>Identifier</Label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="manual_demo_parse_mode"
                  value="external_match_room_id"
                  checked={mode === "external_match_room_id"}
                  onChange={() => setMode("external_match_room_id")}
                />
                FACEIT match id (external_match_room_id)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="manual_demo_parse_mode"
                  value="match_id"
                  checked={mode === "match_id"}
                  onChange={() => setMode("match_id")}
                />
                Match ID
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="manual_demo_parse_mode"
                  value="match_game_id"
                  checked={mode === "match_game_id"}
                  onChange={() => setMode("match_game_id")}
                />
                Match game ID
              </label>
            </div>
          </div>

          {mode === "external_match_room_id" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="external_match_room_id">
                  FACEIT match id (external_match_room_id)
                </Label>
                <Input
                  id="external_match_room_id"
                  name="external_match_room_id"
                  required
                  value={externalMatchRoomId}
                  onChange={(ev) => setExternalMatchRoomId(ev.target.value)}
                  placeholder="e.g. 1-00000002-0002-4000-8000-000000000002"
                />
              </div>
            </>
          ) : mode === "match_id" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="match_id">Match ID</Label>
                <Input
                  id="match_id"
                  name="match_id"
                  type="number"
                  min={1}
                  required
                  value={matchId}
                  onChange={(ev) => setMatchId(ev.target.value)}
                  placeholder="e.g. 12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="map_order">Map order</Label>
                <Input
                  id="map_order"
                  name="map_order"
                  type="number"
                  min={1}
                  required
                  value={mapOrder}
                  onChange={(ev) => setMapOrder(ev.target.value)}
                  placeholder="e.g. 1"
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="match_game_id">Match game ID</Label>
              <Input
                id="match_game_id"
                name="match_game_id"
                type="number"
                min={1}
                required
                value={matchGameId}
                onChange={(ev) => setMatchGameId(ev.target.value)}
                placeholder="e.g. 12345"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="download_url">Demo download URL (HTTPS)</Label>
            <Input
              id="download_url"
              name="download_url"
              type="url"
              required
              value={downloadUrl}
              onChange={(ev) => setDownloadUrl(ev.target.value)}
              placeholder="https://…"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority (1–10, default 5)</Label>
            <Input
              id="priority"
              name="priority"
              type="number"
              min={1}
              max={10}
              value={priority}
              onChange={(ev) => setPriority(ev.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="reparse"
              checked={reparse}
              onCheckedChange={(val) => setReparse(val === true)}
            />
            <Label htmlFor="reparse">Reparse (force re-processing)</Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="mark_finished"
              checked={markFinished}
              onCheckedChange={(val) => setMarkFinished(val === true)}
            />
            <Label htmlFor="mark_finished">
              Mark match as finished (computed end time)
            </Label>
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Enqueue parse_queue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
