import { z } from "zod";
import {
  FaceitGame,
  FaceitMatchTeams,
  FaceitMapVoting,
  FaceitLocationVoting,
  BaseMatchDetailsSchema,
  FaceitGameSchema,
  FaceitMapVotingSchema,
  FaceitLocationVotingSchema,
  FaceitMatchStatus
} from "./Details.interface";

// Voting system for configuring matches
export interface FaceitConfiguringVoting {
  map: FaceitMapVoting;
  voted_entity_types: string[];
  location: FaceitLocationVoting;
}

// Main interface for FACEIT match details when status is CONFIGURING
export interface DetailsConfiguring {
  match_id: string;
  version: number;
  game: FaceitGame;
  region: string;
  competition_id: string;
  competition_type: string;
  competition_name: string;
  organizer_id: string;
  teams: FaceitMatchTeams;
  voting: FaceitConfiguringVoting;
  calculate_elo: boolean;
  scheduled_at?: number; // Unix timestamp
  configured_at: number; // Unix timestamp
  chat_room_id: string;
  best_of: number;
  status: "CONFIGURING";
  round?: number; // Optional since not always present
  group?: number; // Optional since not always present
  faceit_url: string;
}

// Zod schemas for runtime validation
const FaceitConfiguringVotingSchema = z.object({
  map: FaceitMapVotingSchema,
  voted_entity_types: z.array(z.string()),
  location: FaceitLocationVotingSchema
});

export const DetailsConfiguringSchema = BaseMatchDetailsSchema.extend({
  game: FaceitGameSchema,
  voting: FaceitConfiguringVotingSchema,
  scheduled_at: z.number().optional(),
  configured_at: z.number(),
  status: z.literal(FaceitMatchStatus.CONFIGURING),
  round: z.number().optional(),
  group: z.number().optional()
});

// Runtime validation function
export function validateDetailsConfiguring(data: unknown): DetailsConfiguring {
  return DetailsConfiguringSchema.parse(data);
}
