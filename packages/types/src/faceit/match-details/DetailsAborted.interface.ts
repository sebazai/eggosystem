import { z } from "zod";
import {
  FaceitGame,
  FaceitMapVoting,
  FaceitMatchResultsAbortedAndCancelled,
  FaceitDetailedResultsAbortedAndCancelled,
  FaceitMatchTeams,
  BaseMatchDetailsSchema,
  FaceitMatchResultsAbortedAndCancelledSchema,
  FaceitDetailedResultsAbortedAndCancelledSchema,
  FaceitMatchStatus,
  FaceitGameSchema,
  FaceitVotingSchema
} from "./Details.interface";

// Voting interface
interface FaceitMatchVotingAborted {
  map: FaceitMapVoting;
  voted_entity_types: string[];
}

// Main match details interface for aborted matches
export interface DetailsAborted {
  match_id: string;
  version: number;
  game: FaceitGame;
  region: string;
  competition_id: string;
  competition_type: string;
  competition_name: string;
  organizer_id: string;
  teams: FaceitMatchTeams;
  voting: FaceitMatchVotingAborted;
  calculate_elo: boolean;
  configured_at: number;
  chat_room_id: string;
  best_of: number;
  results: FaceitMatchResultsAbortedAndCancelled;
  detailed_results: FaceitDetailedResultsAbortedAndCancelled[];
  status: "ABORTED";
  round?: number; // Optional since not always present
  group?: number; // Optional since not always present
  faceit_url: string;
}

export const FaceitMatchDetailsAbortedSchema = BaseMatchDetailsSchema.extend({
  game: FaceitGameSchema,
  voting: FaceitVotingSchema,
  configured_at: z.number(),
  results: FaceitMatchResultsAbortedAndCancelledSchema,
  detailed_results: z.array(FaceitDetailedResultsAbortedAndCancelledSchema),
  status: z.literal(FaceitMatchStatus.ABORTED),
  round: z.number().optional(),
  group: z.number().optional()
});

// Runtime validation function
export function validateDetailsAborted(data: unknown): DetailsAborted {
  return FaceitMatchDetailsAbortedSchema.parse(data);
}
