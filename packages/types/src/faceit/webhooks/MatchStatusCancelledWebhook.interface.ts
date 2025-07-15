import { MatchEntity, MatchTeam } from "./Webhooks.interface";

interface MatchStatusCancelledPayload {
  id: string;
  organizer_id: string;
  region: string;
  game: string;
  version: number;
  reason: "AFK" | "MANUAL";
  players: unknown[]; // Empty in example, type unclear
  afk: string[]; // Faceit player ids
  entity: MatchEntity;
  teams: MatchTeam[];
  created_at: string;
  updated_at: string;
}

export interface MatchStatusCancelledWebhook {
  transaction_id: string;
  event: "match_status_cancelled";
  event_id: string;
  third_party_id: string;
  app_id: string;
  timestamp: string;
  retry_count: number;
  version: number;
  payload: MatchStatusCancelledPayload;
}
