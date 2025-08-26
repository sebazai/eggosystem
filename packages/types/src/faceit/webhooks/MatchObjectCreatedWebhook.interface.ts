import { z } from "zod";
import {
  FaceitGame,
  FaceitGameSchema
} from "../match-details/Details.interface";
import { BaseWebhookSchema } from "./Webhooks.interface";

interface MatchObjectCreatedEntity {
  id: string;
  name: string;
  type: string;
}

interface MatchObjectCreatedPayload {
  id: string;
  organizer_id: string;
  region: string;
  game: FaceitGame;
  version: number;
  entity: MatchObjectCreatedEntity;
  created_at: string;
  updated_at: string;
}

export interface MatchObjectCreatedWebhook {
  transaction_id: string;
  event: "match_object_created";
  event_id: string;
  third_party_id: string;
  app_id: string;
  timestamp: string;
  retry_count: number;
  version: number;
  payload: MatchObjectCreatedPayload;
}

// Zod schemas for runtime validation
const MatchObjectCreatedEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string()
});

// Use the imported FaceitGameSchema directly
const MatchObjectCreatedPayloadSchema = z.object({
  id: z.string(),
  organizer_id: z.string(),
  region: z.string(),
  game: FaceitGameSchema, // Use the pre-defined schema instead of z.enum(FaceitGame)
  version: z.number(),
  entity: MatchObjectCreatedEntitySchema,
  created_at: z.string(),
  updated_at: z.string()
});

export const MatchObjectCreatedWebhookSchema = BaseWebhookSchema.extend({
  event: z.literal("match_object_created"),
  payload: MatchObjectCreatedPayloadSchema
});

// Runtime validation function
export function validateMatchObjectCreatedWebhook(
  data: unknown
): MatchObjectCreatedWebhook {
  return MatchObjectCreatedWebhookSchema.parse(data);
}
