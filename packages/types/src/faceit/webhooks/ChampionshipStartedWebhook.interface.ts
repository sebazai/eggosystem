import { z } from "zod";
import { BaseWebhookSchema } from "./Webhooks.interface";

export interface ChampionshipStartedWebhook {
  transaction_id: string;
  event: "championship_started";
  event_id: string;
  third_party_id: string;
  app_id: string;
  timestamp: string;
  retry_count: number;
  version: number;
  payload: ChampionshipStartedPayload;
}

interface ChampionshipStartedPayload {
  id: string;
  game: string;
  organizer_id: string;
}

const ChampionshipStartedPayloadSchema = z.object({
  id: z.string(),
  game: z.string(),
  organizer_id: z.string()
});

export const ChampionshipStartedWebhookSchema = BaseWebhookSchema.extend({
  event: z.literal("championship_started"),
  payload: ChampionshipStartedPayloadSchema
});

export function validateChampionshipStartedWebhook(
  data: unknown
): ChampionshipStartedWebhook {
  return ChampionshipStartedWebhookSchema.parse(data);
}
