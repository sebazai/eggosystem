import { z } from "zod";

export interface MatchEntity {
  id: string;
  name: string;
  type: "championship" | "matchmaking";
}

export interface FaceitMatchTeam {
  id: string;
  name: string;
  type: string;
  avatar: string;
  leader_id: string;
  co_leader_id: string;
  roster: TeamPlayer[];
  substitutions: number;
  substitutes: TeamPlayer[];
}

// Simplified team structure for matchmaking webhooks
export interface FaceitMatchmakingTeam {
  id: string;
  name: string;
  players: unknown[]; // Empty array in matchmaking webhooks
}

export interface TeamPlayer {
  id: string;
  nickname: string;
  avatar: string;
  game_id: string;
  game_name: string;
  game_skill_level: number;
  membership: string;
  anticheat_required: boolean;
}

// Shared Zod schemas for runtime validation
export const TeamPlayerSchema = z.object({
  id: z.string(),
  nickname: z.string(),
  avatar: z.string(),
  game_id: z.string(),
  game_name: z.string(),
  game_skill_level: z.number(),
  membership: z.string(),
  anticheat_required: z.boolean()
});

export const MatchTeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  avatar: z.string(),
  leader_id: z.string(),
  co_leader_id: z.string(),
  roster: z.array(TeamPlayerSchema),
  substitutions: z.number(),
  substitutes: z.array(TeamPlayerSchema)
});

// Schema for matchmaking teams (simplified structure)
export const MatchmakingTeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  players: z.array(z.unknown()) // Empty array in matchmaking webhooks
});

// Union schema that can handle both championship and matchmaking team structures
export const FlexibleTeamSchema = z.union([
  MatchTeamSchema,
  MatchmakingTeamSchema
]);

export const MatchEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.literal("championship").or(z.literal("matchmaking"))
});

// Base webhook structure schema
export const BaseWebhookSchema = z.object({
  transaction_id: z.string(),
  event_id: z.string(),
  third_party_id: z.string(),
  app_id: z.string(),
  timestamp: z.string(),
  retry_count: z.number(),
  version: z.number()
});
