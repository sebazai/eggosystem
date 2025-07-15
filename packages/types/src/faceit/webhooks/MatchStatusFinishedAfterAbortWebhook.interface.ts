import { MatchEntity, MatchTeam } from "./Webhooks.interface";

interface MatchStatusFinishedAfterAbortPayload {
  id: string;
  organizer_id: string;
  region: string;
  game: string;
  version: number;
  entity: MatchEntity;
  teams: MatchTeam[];
  created_at: string;
  updated_at: string;
  started_at: "1970-01-01T00:00:00Z"; // "1970-01-01T00:00:00Z" for aborted matches
  finished_at: string;
}

export interface MatchStatusFinishedAfterAbortWebhook {
  transaction_id: string;
  event: "match_status_finished";
  event_id: string;
  third_party_id: string;
  app_id: string;
  timestamp: string;
  retry_count: number;
  version: number;
  payload: MatchStatusFinishedAfterAbortPayload;
}
