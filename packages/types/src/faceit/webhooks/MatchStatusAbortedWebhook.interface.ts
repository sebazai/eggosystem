import { z } from "zod";
import {
  MatchEntity,
  FaceitMatchTeam,
  MatchEntitySchema,
  MatchTeamSchema,
  BaseWebhookSchema
} from "./Webhooks.interface";

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
  teams: FaceitMatchTeam[];
  created_at: string;
  updated_at: string;
}

// Zod schemas for runtime validation
const MatchStatusAbortedPayloadSchema = z.object({
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

export const MatchStatusAbortedWebhookSchema = BaseWebhookSchema.extend({
  event: z.literal("match_status_aborted"),
  payload: MatchStatusAbortedPayloadSchema
});

// Runtime validation function
export function validateMatchStatusAbortedWebhook(
  data: unknown
): MatchStatusAbortedWebhook {
  return MatchStatusAbortedWebhookSchema.parse(data);
}
