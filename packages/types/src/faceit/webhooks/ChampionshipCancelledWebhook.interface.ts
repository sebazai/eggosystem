import { z } from "zod";
import { BaseWebhookSchema } from "./Webhooks.interface";

export interface ChampionshipCancelledWebhook {
  transaction_id: string;
  event: "championship_cancelled";
  event_id: string;
  third_party_id: string;
  app_id: string;
  timestamp: string;
  retry_count: number;
  version: number;
  payload: ChampionshipCancelledPayload;
}

interface ChampionshipCancelledPayload {
  id: string;
  game: string;
  organizer_id: string;
}

const ChampionshipCancelledPayloadSchema = z.object({
  id: z.string(),
  game: z.string(),
  organizer_id: z.string()
});

export const ChampionshipCancelledWebhookSchema = BaseWebhookSchema.extend({
  event: z.literal("championship_cancelled"),
  payload: ChampionshipCancelledPayloadSchema
});

export function validateChampionshipCancelledWebhook(
  data: unknown
): ChampionshipCancelledWebhook {
  return ChampionshipCancelledWebhookSchema.parse(data);
}
