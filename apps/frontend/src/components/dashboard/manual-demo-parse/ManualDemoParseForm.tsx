"use client";

import { useState } from "react";
import { clientApiFetch, ApiError } from "@/lib/apiClient";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

type EnqueueSuccess = {
  status: "enqueued";
  match_game_id: number;
};

export function ManualDemoParseForm() {
  const [matchGameId, setMatchGameId] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [priority, setPriority] = useState("5");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Array<{
    path: (string | number)[];
    message: string;
  }> | null>(null);
  const [success, setSuccess] = useState<EnqueueSuccess | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIssues(null);
    setSuccess(null);
    setSubmitting(true);

    const idNum = Number.parseInt(matchGameId, 10);
    const priNum = Number.parseInt(priority, 10);

    try {
      const body = {
        match_game_id: idNum,
        download_url: downloadUrl.trim(),
        ...(Number.isFinite(priNum) ? { priority: priNum } : {})
      };

      const data = await clientApiFetch<EnqueueSuccess>(
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
          Paste a valid HTTPS demo download URL for a MatchGame ID. The job is
          sent to parse_queue with source{" "}
          <code className="text-xs">dashboard-manual</code>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
              {issues?.length ? (
                <ul className="mt-2 list-inside list-disc text-sm">
                  {issues.map((issue, i) => (
                    <li key={i}>{issue.message}</li>
                  ))}
                </ul>
              ) : null}
            </Alert>
          ) : null}
          {success ? (
            <Alert>
              <AlertDescription>
                Enqueued parse for match game{" "}
                <strong>{success.match_game_id}</strong>.
              </AlertDescription>
            </Alert>
          ) : null}

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

          <Button type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Enqueue parse_queue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
