import { z } from "zod";
import {
  FaceitMatchResultsAbortedAndCancelled,
  FaceitDetailedResultsAbortedAndCancelled,
  FaceitMatchTeams,
  FaceitMatchResultsAbortedAndCancelledSchema,
  FaceitDetailedResultsAbortedAndCancelledSchema,
  FaceitMatchStatus,
  FaceitVotingSchema,
  FaceitVoting,
  FaceitMatchTeamsSchema
} from "./Details.interface";

// Main match details interface for aborted matches
export interface DetailsAborted {
  match_id: string;
  version: number;
  game: string;
  region: string;
  competition_id: string;
  competition_name: string;
  organizer_id: string;
  teams: FaceitMatchTeams;
  voting: FaceitVoting;
  calculate_elo: boolean;
  scheduled_at?: number;
  configured_at: number;
  chat_room_id: string;
  best_of: number;
  results?: FaceitMatchResultsAbortedAndCancelled;
  detailed_results?: FaceitDetailedResultsAbortedAndCancelled[];
  status: typeof FaceitMatchStatus.ABORTED;
  faceit_url: string;
}

const MatchDetailsAbortedBaseSchema = z.object({
  match_id: z.string(),
  version: z.number(),
  game: z.string(),
  region: z.string(),
  competition_id: z.string(),
  competition_name: z.string(),
  organizer_id: z.string(),
  teams: FaceitMatchTeamsSchema,
  voting: FaceitVotingSchema,
  calculate_elo: z.boolean(),
  scheduled_at: z.number().optional(),
  configured_at: z.number(),
  chat_room_id: z.string(),
  best_of: z.number(),
  results: FaceitMatchResultsAbortedAndCancelledSchema.optional(),
  detailed_results: z
    .array(FaceitDetailedResultsAbortedAndCancelledSchema)
    .optional(),
  status: z.literal(FaceitMatchStatus.ABORTED),
  faceit_url: z.string()
});

interface MatchmakingDetailsAborted extends DetailsAborted {
  competition_type: "matchmaking";
}

export const MatchmakingMatchDetailsAbortedSchema =
  MatchDetailsAbortedBaseSchema.extend({
    competition_type: z.literal("matchmaking")
  });

export function validateMatchmakingDetailsAborted(
  data: unknown
): MatchmakingDetailsAborted {
  return MatchmakingMatchDetailsAbortedSchema.parse(data);
}

interface ChampionshipDetailsAborted extends DetailsAborted {
  competition_type: "championship";
  round: number;
  group: number;
}

export const ChampionshipMatchDetailsAbortedSchema =
  MatchDetailsAbortedBaseSchema.extend({
    competition_type: z.literal("championship"),
    round: z.number(),
    group: z.number()
  });

export function validateChampionshipDetailsAborted(
  data: unknown
): ChampionshipDetailsAborted {
  return ChampionshipMatchDetailsAbortedSchema.parse(data);
}
