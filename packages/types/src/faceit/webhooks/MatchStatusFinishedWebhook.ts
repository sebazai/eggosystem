import { z } from "zod";
import {
  MatchEntity,
  FaceitMatchTeam,
  MatchEntitySchema,
  MatchTeamSchema,
  BaseWebhookSchema
} from "./Webhooks.interface";

interface MatchStatusFinishedPayload {
  id: string;
  organizer_id: string;
  region: string;
  game: string;
  version: number;
  entity: MatchEntity;
  teams: FaceitMatchTeam[];
  created_at: string;
  updated_at: string;
  started_at: string; // Real timestamp for matches that actually started
  finished_at: string;
}

export interface MatchStatusFinishedWebhook {
  transaction_id: string;
  event: "match_status_finished";
  event_id: string;
  third_party_id: string;
  app_id: string;
  timestamp: string;
  retry_count: number;
  version: number;
  payload: MatchStatusFinishedPayload;
}

// Zod schemas for runtime validation
const MatchStatusFinishedPayloadSchema = z.object({
  id: z.string(),
  organizer_id: z.string(),
  region: z.string(),
  game: z.string(),
  version: z.number(),
  entity: MatchEntitySchema,
  teams: z.array(MatchTeamSchema),
  created_at: z.string(),
  updated_at: z.string(),
  started_at: z.string(),
  finished_at: z.string()
});

export const MatchStatusFinishedWebhookSchema = BaseWebhookSchema.extend({
  event: z.literal("match_status_finished"),
  payload: MatchStatusFinishedPayloadSchema
});

// Runtime validation function
export function validateMatchStatusFinishedWebhook(
  data: unknown
): MatchStatusFinishedWebhook {
  return MatchStatusFinishedWebhookSchema.parse(data);
}
