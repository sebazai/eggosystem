import { MatchEntity, MatchTeam } from "./Webhooks.interface";

interface MatchDemoReadyPayload {
  id: string;
  organizer_id: string;
  region: string;
  game: string;
  entity: MatchEntity;
  created_at: string;
  updated_at: string;
  version: number;
  demo_url: string; // URL to download the demo file
  teams: MatchTeam[];
}

export interface MatchDemoReadyWebhook {
  transaction_id: string;
  event: "match_demo_ready";
  event_id: string;
  third_party_id: string;
  app_id: string;
  timestamp: string;
  retry_count: number;
  version: number;
  payload: MatchDemoReadyPayload;
}
