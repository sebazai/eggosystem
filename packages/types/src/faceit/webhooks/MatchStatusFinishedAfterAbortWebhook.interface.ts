import { z } from "zod";
import {
  MatchEntity,
  FaceitMatchTeam,
  MatchEntitySchema,
  MatchTeamSchema,
  BaseWebhookSchema
} from "./Webhooks.interface";

interface MatchStatusFinishedAfterAbortPayload {
  id: string;
  organizer_id: string;
  region: string;
  game: string;
  version: number;
  entity: MatchEntity;
  teams: FaceitMatchTeam[];
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

// Zod schemas for runtime validation
const MatchStatusFinishedAfterAbortPayloadSchema = z.object({
  id: z.string(),
  organizer_id: z.string(),
  region: z.string(),
  game: z.string(),
  version: z.number(),
  entity: MatchEntitySchema,
  teams: z.array(MatchTeamSchema),
  created_at: z.string(),
  updated_at: z.string(),
  started_at: z.literal("1970-01-01T00:00:00Z"), // Specific literal for aborted matches
  finished_at: z.string()
});

export const MatchStatusFinishedAfterAbortWebhookSchema =
  BaseWebhookSchema.extend({
    event: z.literal("match_status_finished"),
    payload: MatchStatusFinishedAfterAbortPayloadSchema
  });

// Runtime validation function
export function validateMatchStatusFinishedAfterAbortWebhook(
  data: unknown
): MatchStatusFinishedAfterAbortWebhook {
  const safeType = MatchStatusFinishedAfterAbortWebhookSchema.parse(data);
  return safeType satisfies MatchStatusFinishedAfterAbortWebhook;
}
