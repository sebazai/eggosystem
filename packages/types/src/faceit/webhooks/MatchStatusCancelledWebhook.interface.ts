import { z } from "zod";
import {
  MatchEntity,
  FaceitMatchTeam,
  MatchEntitySchema,
  MatchTeamSchema,
  BaseWebhookSchema
} from "./Webhooks.interface";
import { WebhookValidationError } from ".";

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
  teams: FaceitMatchTeam[];
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

// Zod schemas for runtime validation
const MatchStatusCancelledPayloadSchema = z.object({
  id: z.string(),
  organizer_id: z.string(),
  region: z.string(),
  game: z.string(),
  version: z.number(),
  reason: z.enum(["AFK", "MANUAL"]),
  players: z.array(z.unknown()),
  afk: z.array(z.string()),
  entity: MatchEntitySchema,
  teams: z.array(MatchTeamSchema),
  created_at: z.string(),
  updated_at: z.string()
});

export const MatchStatusCancelledWebhookSchema = BaseWebhookSchema.extend({
  event: z.literal("match_status_cancelled"),
  payload: MatchStatusCancelledPayloadSchema
});

// Runtime validation function
export function validateMatchStatusCancelledWebhook(
  data: unknown
): MatchStatusCancelledWebhook {
  const safeType = MatchStatusCancelledWebhookSchema.safeParse(data);
  if (!safeType.success) {
    throw new WebhookValidationError(
      `MatchStatusCancelledWebhook validation failed: ${JSON.stringify(safeType.error)}`
    );
  }
  return safeType.data satisfies MatchStatusCancelledWebhook;
}
