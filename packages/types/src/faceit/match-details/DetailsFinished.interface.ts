import { z } from "zod";
import {
  FaceitDetailedResultsFinished,
  FaceitGame,
  FaceitMapVoting,
  FaceitMatchResultsFinished,
  FaceitMatchTeams,
  BaseMatchDetailsSchema,
  FaceitMapVotingSchema,
  FaceitMatchResultsFinishedSchema,
  FaceitDetailedResultsFinishedSchema,
  FaceitMatchStatus
} from "./Details.interface";
import { MatchDetailsValidationError } from ".";

// Voting interface
interface FaceitMatchVotingFinished {
  map: FaceitMapVoting;
  voted_entity_types: string[];
}

// Main match details interface for finished matches (after aborted)
export interface FaceitMatchDetailsFinishedAfterAborted {
  match_id: string;
  version: number;
  game: FaceitGame.CS2;
  region: string;
  competition_id: string;
  competition_type: string;
  competition_name: string;
  organizer_id: string;
  teams: FaceitMatchTeams;
  voting: FaceitMatchVotingFinished;
  scheduled_at?: number;
  calculate_elo: boolean;
  configured_at: number;
  finished_at: number;
  chat_room_id: string;
  best_of: number;
  results: FaceitMatchResultsFinished;
  detailed_results: FaceitDetailedResultsFinished[];
  status: "FINISHED";
  round: number;
  group: number;
  faceit_url: string;
}

// Zod schemas for runtime validation
const FaceitMatchVotingFinishedSchema = z.object({
  map: FaceitMapVotingSchema,
  voted_entity_types: z.array(z.string())
});

export const FaceitMatchDetailsFinishedAfterAbortedSchema =
  BaseMatchDetailsSchema.extend({
    game: z.literal(FaceitGame.CS2),
    voting: FaceitMatchVotingFinishedSchema,
    scheduled_at: z.number().optional(),
    configured_at: z.number(),
    finished_at: z.number(),
    results: FaceitMatchResultsFinishedSchema,
    detailed_results: z.array(FaceitDetailedResultsFinishedSchema),
    status: z.literal(FaceitMatchStatus.FINISHED)
  });

// Runtime validation function
export function validateFaceitMatchDetailsFinishedAfterAborted(
  data: unknown
): FaceitMatchDetailsFinishedAfterAborted {
  const safeType = FaceitMatchDetailsFinishedAfterAbortedSchema.safeParse(data);
  if (!safeType.success) {
    throw new MatchDetailsValidationError(
      `FaceitMatchDetailsFinishedAfterAborted validation failed: ${JSON.stringify(safeType.error)}`
    );
  }
  return safeType.data satisfies FaceitMatchDetailsFinishedAfterAborted;
}
