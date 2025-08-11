import { z } from "zod";
import { BaseWebhookSchema } from "./Webhooks.interface";

export interface ChampionshipCreatedWebhook {
  transaction_id: string;
  event: "championship_created";
  event_id: string;
  third_party_id: string;
  app_id: string;
  timestamp: string;
  retry_count: number;
  version: number;
  payload: ChampionshipCreatedPayload;
}

interface ChampionshipCreatedPayload {
  id: string;
  name: string;
  owner_id: string;
  organizer_id: string;
  game: string;
  region: string;
  description: string;
  type: string;
  status: string;
  published: boolean;
  featured: boolean;
  archived: boolean;
  admin_tool_enabled: boolean;
  check_in_enabled: boolean;
  rulesId: string;
  slots: number;
  total_rounds: number;
  total_groups: number;
  check_in_clear: string;
  check_in_start: string;
  subscription_end: string;
  subscription_start: string;
  assets?: {
    avatar: string;
    background: string;
    cover: string;
    featured: string;
  };
  roles?: Array<{
    id: string;
    name: string;
    permissions: string[];
    ranking: number;
    color: string;
    type: string;
    visible_on_chat: boolean;
  }>;
}

// Zod schemas for runtime validation
const ChampionshipAssetsSchema = z.object({
  avatar: z.string(),
  background: z.string(),
  cover: z.string(),
  featured: z.string()
});

const ChampionshipRoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  permissions: z.array(z.string()),
  ranking: z.number(),
  color: z.string(),
  type: z.string(),
  visible_on_chat: z.boolean()
});

const ChampionshipCreatedPayloadSchema = z.object({
  id: z.string(),
  name: z.string(),
  owner_id: z.string(),
  organizer_id: z.string(),
  game: z.string(),
  region: z.string(),
  description: z.string(),
  type: z.string(),
  status: z.string(),
  published: z.boolean(),
  featured: z.boolean(),
  archived: z.boolean(),
  admin_tool_enabled: z.boolean(),
  check_in_enabled: z.boolean(),
  rulesId: z.string(),
  slots: z.number(),
  total_rounds: z.number(),
  total_groups: z.number(),
  check_in_clear: z.string(),
  check_in_start: z.string(),
  subscription_end: z.string(),
  subscription_start: z.string(),
  assets: ChampionshipAssetsSchema.optional(),
  roles: z.array(ChampionshipRoleSchema).optional()
});

export const ChampionshipCreatedWebhookSchema = BaseWebhookSchema.extend({
  event: z.literal("championship_created"),
  payload: ChampionshipCreatedPayloadSchema
});

// Runtime validation function
export function validateChampionshipCreatedWebhook(
  data: unknown
): ChampionshipCreatedWebhook {
  return ChampionshipCreatedWebhookSchema.parse(data);
}
