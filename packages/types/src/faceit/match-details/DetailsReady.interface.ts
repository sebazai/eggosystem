import { z } from "zod";
import {
  FaceitGame,
  FaceitMatchTeams,
  FaceitMapVoting,
  FaceitLocationVoting,
  BaseMatchDetailsSchema,
  FaceitMapVotingSchema,
  FaceitLocationVotingSchema,
  FaceitMatchStatus
} from "./Details.interface";

// Voting system for ready matches (same structure as configuring)
export interface FaceitReadyVoting {
  map: FaceitMapVoting;
  voted_entity_types: string[];
  location: FaceitLocationVoting;
}

// Main interface for FACEIT match details when status is READY
export interface DetailsReady {
  match_id: string;
  version: number;
  game: FaceitGame.CS2;
  region: string;
  competition_id: string;
  competition_type: string;
  competition_name: string;
  organizer_id: string;
  teams: FaceitMatchTeams;
  voting: FaceitReadyVoting;
  calculate_elo: boolean;
  scheduled_at: number; // Unix timestamp
  configured_at: number; // Unix timestamp
  chat_room_id: string;
  best_of: number;
  status: "READY";
  round: number;
  group: number;
  faceit_url: string;
}

// Zod schemas for runtime validation
const FaceitReadyVotingSchema = z.object({
  map: FaceitMapVotingSchema,
  voted_entity_types: z.array(z.string()),
  location: FaceitLocationVotingSchema
});

export const DetailsReadySchema = BaseMatchDetailsSchema.extend({
  game: z.literal(FaceitGame.CS2),
  voting: FaceitReadyVotingSchema,
  scheduled_at: z.number(),
  configured_at: z.number(),
  status: z.literal(FaceitMatchStatus.READY)
});

// Runtime validation function
export function validateDetailsReady(data: unknown): DetailsReady {
  return DetailsReadySchema.parse(data);
}
