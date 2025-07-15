import { z } from "zod";
import {
  MatchEntity,
  FaceitMatchTeam,
  MatchEntitySchema,
  MatchTeamSchema,
  BaseWebhookSchema
} from "./Webhooks.interface";
import { WebhookValidationError } from ".";

interface MatchStatusConfiguringPayload {
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

export interface MatchStatusConfiguringWebhook {
  transaction_id: string;
  event: "match_status_configuring";
  event_id: string;
  third_party_id: string;
  app_id: string;
  timestamp: string;
  retry_count: number;
  version: number;
  payload: MatchStatusConfiguringPayload;
}

// Zod schemas for runtime validation
const MatchStatusConfiguringPayloadSchema = z.object({
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

export const MatchStatusConfiguringWebhookSchema = BaseWebhookSchema.extend({
  event: z.literal("match_status_configuring"),
  payload: MatchStatusConfiguringPayloadSchema
});

// Runtime validation function
export function validateMatchStatusConfiguringWebhook(
  data: unknown
): MatchStatusConfiguringWebhook {
  const safeType = MatchStatusConfiguringWebhookSchema.safeParse(data);
  if (!safeType.success) {
    throw new WebhookValidationError(
      `MatchStatusConfiguringWebhook validation failed: ${JSON.stringify(safeType.error)}`
    );
  }
  return safeType.data satisfies MatchStatusConfiguringWebhook;
}
