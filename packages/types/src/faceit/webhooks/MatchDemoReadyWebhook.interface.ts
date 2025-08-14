import { z } from "zod";
import {
  FaceitMatchTeam,
  FaceitMatchmakingTeam,
  FlexibleTeamSchema,
  BaseWebhookSchema,
  MatchEntity,
  MatchEntitySchema
} from "./Webhooks.interface";

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
  teams: (FaceitMatchTeam | FaceitMatchmakingTeam)[];
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

// Zod schemas for runtime validation
const MatchDemoReadyPayloadSchema = z.object({
  id: z.string(),
  organizer_id: z.string(),
  region: z.string(),
  game: z.string(),
  entity: MatchEntitySchema,
  created_at: z.string(),
  updated_at: z.string(),
  version: z.number(),
  demo_url: z.string().url(), // Validate it's a proper URL
  teams: z.array(FlexibleTeamSchema)
});

export const MatchDemoReadyWebhookSchema = BaseWebhookSchema.extend({
  event: z.literal("match_demo_ready"),
  payload: MatchDemoReadyPayloadSchema
});

// Runtime validation function
export function validateMatchDemoReadyWebhook(
  data: unknown
): MatchDemoReadyWebhook {
  return MatchDemoReadyWebhookSchema.parse(data);
}
