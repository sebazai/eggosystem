import { z } from "zod";
import {
  FaceitMatchTeams,
  FaceitMatchStatus,
  FaceitMatchTeamsSchema,
  FaceitDetailedResultsAbortedAndCancelledSchema,
  FaceitMatchResultsAbortedAndCancelledSchema,
  FaceitDetailedResultsAbortedAndCancelled,
  FaceitMatchResultsAbortedAndCancelled
} from "./Details.interface";

interface DetailsCancelledBase {
  match_id: string;
  version: number;
  game: string;
  region: string;
  competition_id: string;
  competition_name: string;
  organizer_id: string;
  teams: FaceitMatchTeams;
  calculate_elo: boolean;
  results?: FaceitMatchResultsAbortedAndCancelled;
  detailed_results?: FaceitDetailedResultsAbortedAndCancelled[];
  finished_at: number;
  chat_room_id: string;
  best_of: number;
  status: typeof FaceitMatchStatus.CANCELLED;
  faceit_url: string;
}

const MatchDetailsCancelledBaseSchema = z.object({
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
  results: FaceitMatchResultsAbortedAndCancelledSchema.optional(),
  detailed_results: z
    .array(FaceitDetailedResultsAbortedAndCancelledSchema)
    .optional(),
  faceit_url: z.string(),
  finished_at: z.number(),
  best_of: z.number(),
  status: z.literal(FaceitMatchStatus.CANCELLED)
});

export interface MatchmakingDetailsCancelled extends DetailsCancelledBase {
  competition_type: "matchmaking";
}

export const MatchmakingFaceitDetailsCancelledSchema =
  MatchDetailsCancelledBaseSchema.extend({
    competition_type: z.literal("matchmaking")
  });

// Runtime validation function
export function validateMatchmakingDetailsCancelled(
  data: unknown
): MatchmakingDetailsCancelled {
  return MatchmakingFaceitDetailsCancelledSchema.parse(data);
}

export interface ChampionshipDetailsCancelled extends DetailsCancelledBase {
  competition_type: "championship";
  round: number;
  group: number;
}

export const ChampionshipDetailsCancelledSchema =
  MatchDetailsCancelledBaseSchema.extend({
    competition_type: z.literal("championship"),
    finished_at: z.number(),
    round: z.number(),
    group: z.number()
  });

export function validateChampionshipDetailsCancelled(
  data: unknown
): ChampionshipDetailsCancelled {
  return ChampionshipDetailsCancelledSchema.parse(data);
}
