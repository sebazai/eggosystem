import { z } from "zod";
import {
  FaceitGame,
  FaceitMapVoting,
  FaceitMatchResultsAbortedAndCancelled,
  FaceitDetailedResultsAbortedAndCancelled,
  FaceitMatchTeams,
  BaseMatchDetailsSchema,
  FaceitMapVotingSchema,
  FaceitMatchResultsAbortedAndCancelledSchema,
  FaceitDetailedResultsAbortedAndCancelledSchema,
  FaceitMatchStatus
} from "./Details.interface";
import { MatchDetailsValidationError } from ".";

// Voting interface
interface FaceitMatchVotingAborted {
  map: FaceitMapVoting;
  voted_entity_types: string[];
}
// Main match details interface for aborted matches
export interface FaceitMatchDetailsAborted {
  match_id: string;
  version: number;
  game: FaceitGame.CS2;
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
  round: number;
  group: number;
  faceit_url: string;
}

// Zod schemas for runtime validation
const FaceitMatchVotingAbortedSchema = z.object({
  map: FaceitMapVotingSchema,
  voted_entity_types: z.array(z.string())
});

export const FaceitMatchDetailsAbortedSchema = BaseMatchDetailsSchema.extend({
  game: z.literal(FaceitGame.CS2),
  voting: FaceitMatchVotingAbortedSchema,
  configured_at: z.number(),
  results: FaceitMatchResultsAbortedAndCancelledSchema,
  detailed_results: z.array(FaceitDetailedResultsAbortedAndCancelledSchema),
  status: z.literal(FaceitMatchStatus.ABORTED)
});

// Runtime validation function
export function validateFaceitMatchDetailsAborted(
  data: unknown
): FaceitMatchDetailsAborted {
  const safeType = FaceitMatchDetailsAbortedSchema.safeParse(data);
  if (!safeType.success) {
    throw new MatchDetailsValidationError(
      `FaceitMatchDetailsAborted validation failed: ${JSON.stringify(safeType.error)}`
    );
  }
  return safeType.data satisfies FaceitMatchDetailsAborted;
}
