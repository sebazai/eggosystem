import { z } from "zod";
import {
  FaceitDetailedResultsFinished,
  FaceitMatchResultsFinished,
  FaceitMatchTeams,
  FaceitMatchResultsFinishedSchema,
  FaceitDetailedResultsFinishedSchema,
  FaceitMatchStatus,
  FaceitVotingSchema,
  FaceitMatchTeamsSchema,
  FaceitVoting
} from "./Details.interface";

// Main match details interface for finished matches (after aborted as well)
export interface FaceitMatchDetailsFinished {
  match_id: string;
  version: number;
  game: string;
  region: string;
  competition_id: string;
  competition_name: string;
  organizer_id: string;
  teams: FaceitMatchTeams;
  voting: FaceitVoting;
  scheduled_at?: number;
  calculate_elo: boolean;
  configured_at: number;
  finished_at: number;
  started_at: number;
  demo_url: string[];
  chat_room_id: string;
  best_of: number;
  results: FaceitMatchResultsFinished;
  detailed_results: FaceitDetailedResultsFinished[];
  status: typeof FaceitMatchStatus.FINISHED;
  faceit_url: string;
}

// Base match details schema with common fields
const MatchFinishedBaseSchema = z.object({
  match_id: z.string(),
  version: z.number(),
  game: z.string(),
  region: z.string(),
  competition_id: z.string(),
  competition_name: z.string(),
  organizer_id: z.string(),
  teams: FaceitMatchTeamsSchema,
  calculate_elo: z.boolean(),
  chat_room_id: z.string(),
  best_of: z.number(),
  faceit_url: z.string(),
  voting: FaceitVotingSchema,
  scheduled_at: z.number().optional(),
  started_at: z.number(),
  demo_url: z.array(z.string()),
  configured_at: z.number(),
  finished_at: z.number(),
  results: FaceitMatchResultsFinishedSchema,
  detailed_results: z.array(FaceitDetailedResultsFinishedSchema),
  status: z.literal(FaceitMatchStatus.FINISHED)
});

export interface MatchmakingDetailsFinished extends FaceitMatchDetailsFinished {
  competition_type: "matchmaking";
}

export const MatchmakingDetailsFinishedSchema = MatchFinishedBaseSchema.extend({
  competition_type: z.literal("matchmaking")
});

export function validateMatchmakingDetailsFinished(
  data: unknown
): MatchmakingDetailsFinished {
  return MatchmakingDetailsFinishedSchema.parse(data);
}

export interface ChampionshipDetailsFinished
  extends FaceitMatchDetailsFinished {
  competition_type: "championship";
  round: number;
  group: number;
}

export const ChampionshipDetailsFinishedSchema = MatchFinishedBaseSchema.extend(
  {
    competition_type: z.literal("championship"),
    round: z.number(),
    group: z.number()
  }
);

export function validateChampionshipDetailsFinished(
  data: unknown
): ChampionshipDetailsFinished {
  return ChampionshipDetailsFinishedSchema.parse(data);
}
