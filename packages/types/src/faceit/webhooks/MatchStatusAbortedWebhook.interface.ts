import { MatchEntity, MatchTeam } from "./Webhooks.interface";

export interface MatchStatusAbortedWebhook {
  transaction_id: string;
  event: "match_status_aborted";
  event_id: string;
  third_party_id: string;
  app_id: string;
  timestamp: string;
  retry_count: number;
  version: number;
  payload: MatchStatusAbortedPayload;
}

export interface MatchStatusAbortedPayload {
  id: string;
  organizer_id: string;
  region: string;
  game: string;
  version: number;
  entity: MatchEntity;
  teams: MatchTeam[];
  created_at: string;
  updated_at: string;
}
