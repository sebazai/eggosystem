import { z } from "zod";
import {
  MatchEntity,
  FaceitMatchTeam,
  MatchEntitySchema,
  MatchTeamSchema,
  BaseWebhookSchema
} from "./Webhooks.interface";

interface MatchStatusReadyPayload {
  id: string;
  organizer_id: string;
  region: string;
  game: string;
  version: number;
  entity: MatchEntity;
  teams: FaceitMatchTeam[];
  created_at: string;
  updated_at: string;
}

export interface MatchStatusReadyWebhook {
  transaction_id: string;
  event: "match_status_ready";
  event_id: string;
  third_party_id: string;
  app_id: string;
  timestamp: string;
  retry_count: number;
  version: number;
  payload: MatchStatusReadyPayload;
}

// Zod schemas for runtime validation
const MatchStatusReadyPayloadSchema = z.object({
  id: z.string(),
  organizer_id: z.string(),
  region: z.string(),
  game: z.string(),
  version: z.number(),
  entity: MatchEntitySchema,
  teams: z.array(MatchTeamSchema),
  created_at: z.string(),
  updated_at: z.string()
});

export const MatchStatusReadyWebhookSchema = BaseWebhookSchema.extend({
  event: z.literal("match_status_ready"),
  payload: MatchStatusReadyPayloadSchema
});

// Runtime validation function
export function validateMatchStatusReadyWebhook(
  data: unknown
): MatchStatusReadyWebhook {
  const safeType = MatchStatusReadyWebhookSchema.parse(data);
  return safeType satisfies MatchStatusReadyWebhook;
}
