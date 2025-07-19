import { z } from "zod";
import {
  FaceitGame,
  FaceitMatchTeams,
  FaceitMatchResultsFinished,
  FaceitDetailedResultsFinished,
  BaseMatchDetailsSchema,
  FaceitMatchResultsFinishedSchema,
  FaceitDetailedResultsFinishedSchema,
  FaceitMatchStatus,
  FaceitVoting,
  FaceitVotingSchema
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
  voting: FaceitVoting;
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
  round?: number; // Optional since not always present
  group?: number; // Optional since not always present
  faceit_url: string;
}

export const DetailsDemoReadySchema = BaseMatchDetailsSchema.extend({
  game: z.literal(FaceitGame.CS2),
  voting: FaceitVotingSchema,
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
