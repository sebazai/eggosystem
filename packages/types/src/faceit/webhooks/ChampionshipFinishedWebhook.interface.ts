import { z } from "zod";
import { BaseWebhookSchema } from "./Webhooks.interface";

export interface ChampionshipFinishedWebhook {
  transaction_id: string;
  event: "championship_finished";
  event_id: string;
  third_party_id: string;
  app_id: string;
  timestamp: string;
  retry_count: number;
  version: number;
  payload: ChampionshipFinishedPayload;
}

interface ChampionshipFinishedPayload {
  id: string;
  game: string;
  organizer_id: string;
}

const ChampionshipFinishedPayloadSchema = z.object({
  id: z.string(),
  game: z.string(),
  organizer_id: z.string()
});

export const ChampionshipFinishedWebhookSchema = BaseWebhookSchema.extend({
  event: z.literal("championship_finished"),
  payload: ChampionshipFinishedPayloadSchema
});

export function validateChampionshipFinishedWebhook(
  data: unknown
): ChampionshipFinishedWebhook {
  return ChampionshipFinishedWebhookSchema.parse(data);
}
