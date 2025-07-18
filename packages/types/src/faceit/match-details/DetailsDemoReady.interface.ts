import { z } from "zod";
import {
  FaceitGame,
  FaceitMatchTeams,
  FaceitMapVoting,
  FaceitMatchResultsFinished,
  FaceitDetailedResultsFinished,
  BaseMatchDetailsSchema,
  FaceitMapVotingSchema,
  FaceitMatchResultsFinishedSchema,
  FaceitDetailedResultsFinishedSchema,
  FaceitMatchStatus
} from "./Details.interface";

export interface DetailsDemoReady {
  match_id: string;
  version: number;
  game: FaceitGame.CS2;
  region: string;
  competition_id: string;
  competition_type: string;
  competition_name: string;
  organizer_id: string;
  teams: FaceitMatchTeams;
  voting: Voting;
  calculate_elo: boolean;
  scheduled_at?: number;
  configured_at: number;
  started_at: number;
  finished_at: number;
  demo_url: string[];
  chat_room_id: string;
  best_of: number;
  results: FaceitMatchResultsFinished;
  detailed_results: FaceitDetailedResultsFinished[];
  status: FaceitMatchStatus;
  round: number;
  group: number;
  faceit_url: string;
}

export interface Voting {
  voted_entity_types: string[];
  map: FaceitMapVoting;
}

// Zod schemas for runtime validation
const VotingSchema = z.object({
  voted_entity_types: z.array(z.string()),
  map: FaceitMapVotingSchema
});

export const DetailsDemoReadySchema = BaseMatchDetailsSchema.extend({
  game: z.literal(FaceitGame.CS2),
  voting: VotingSchema,
  scheduled_at: z.number().optional(),
  configured_at: z.number(),
  started_at: z.number(),
  finished_at: z.number(),
  demo_url: z.array(z.string().url()),
  results: FaceitMatchResultsFinishedSchema,
  detailed_results: z.array(FaceitDetailedResultsFinishedSchema),
  status: z.literal(FaceitMatchStatus.FINISHED)
});

// Runtime validation function
export function validateDetailsDemoReady(data: unknown): DetailsDemoReady {
  return DetailsDemoReadySchema.parse(data);
}
