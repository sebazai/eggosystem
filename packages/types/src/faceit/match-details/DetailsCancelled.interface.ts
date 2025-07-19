import { z } from "zod";
import {
  FaceitGame,
  FaceitMatchTeams,
  FaceitMapVoting,
  FaceitMatchResultsAbortedAndCancelled,
  FaceitDetailedResultsAbortedAndCancelled,
  FaceitLocationVoting,
  BaseMatchDetailsSchema,
  FaceitMatchResultsAbortedAndCancelledSchema,
  FaceitDetailedResultsAbortedAndCancelledSchema,
  FaceitMatchStatus,
  FaceitGameSchema,
  FaceitVotingSchema
} from "./Details.interface";

export interface DetailsCancelled {
  match_id: string;
  version: number;
  game: FaceitGame;
  region: string;
  competition_id: string;
  competition_type: string;
  competition_name: string;
  organizer_id: string;
  teams: FaceitMatchTeams;
  voting: FaceitCancelledVoting;
  calculate_elo: boolean;
  configured_at: number;
  finished_at: number;
  chat_room_id: string;
  best_of: number;
  results: FaceitMatchResultsAbortedAndCancelled;
  detailed_results: FaceitDetailedResultsAbortedAndCancelled[];
  status: "CANCELLED";
  round?: number; // Optional since not always present
  group?: number; // Optional since not always present
  faceit_url: string;
}

// Extended voting interface that includes location voting (not in Details.interface.ts)
interface FaceitCancelledVoting {
  map: FaceitMapVoting;
  voted_entity_types: string[];
  location: FaceitLocationVoting;
}

export const FaceitDetailsCancelledSchema = BaseMatchDetailsSchema.extend({
  game: FaceitGameSchema,
  voting: FaceitVotingSchema,
  configured_at: z.number(),
  finished_at: z.number(),
  results: FaceitMatchResultsAbortedAndCancelledSchema,
  detailed_results: z.array(FaceitDetailedResultsAbortedAndCancelledSchema),
  status: z.literal(FaceitMatchStatus.CANCELLED),
  round: z.number().optional(),
  group: z.number().optional()
});

// Runtime validation function
export function validateDetailsCancelled(data: unknown): DetailsCancelled {
  return FaceitDetailsCancelledSchema.parse(data);
}
