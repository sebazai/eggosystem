import { z } from "zod";
import {
  FaceitMatchTeams,
  FaceitMatchResultsDemoReady,
  FaceitDetailedResultsDemoReady,
  FaceitMatchResultsDemoReadySchema,
  FaceitDetailedResultsDemoReadySchema,
  FaceitMatchStatus,
  FaceitVoting,
  FaceitVotingSchema,
  FaceitMatchTeamsSchema
} from "./Details.interface";

export interface DetailsDemoReadyBase {
  match_id: string;
  version: number;
  game: string;
  region: string;
  competition_id: string;
  competition_name: string;
  organizer_id: string;
  teams: FaceitMatchTeams;
  voting?: FaceitVoting;
  calculate_elo: boolean;
  scheduled_at?: number;
  configured_at: number;
  started_at: number;
  finished_at?: number;
  demo_url: string[];
  chat_room_id: string;
  best_of: number;
  results: FaceitMatchResultsDemoReady;
  detailed_results: FaceitDetailedResultsDemoReady[];
  status: keyof typeof FaceitMatchStatus;
  faceit_url: string;
}

const DetailsDemoReadBaseSchema = z.object({
  match_id: z.string(),
  version: z.number(),
  game: z.string(),
  region: z.string(),
  competition_id: z.string(),
  competition_name: z.string(),
  organizer_id: z.string(),
  teams: FaceitMatchTeamsSchema,
  voting: FaceitVotingSchema.optional(),
  calculate_elo: z.boolean(),
  scheduled_at: z.number().optional(),
  configured_at: z.number(),
  started_at: z.number(),
  finished_at: z.number().optional(),
  demo_url: z.array(z.string().url()),
  chat_room_id: z.string(),
  best_of: z.number(),
  results: FaceitMatchResultsDemoReadySchema,
  detailed_results: z.array(FaceitDetailedResultsDemoReadySchema),
  status: z.enum(Object.values(FaceitMatchStatus)),
  faceit_url: z.string()
});

export interface MatchmakingDetailsDemoReady extends DetailsDemoReadyBase {
  competition_type: "matchmaking";
}

const MatchmakingDetailsDemoReadySchema = DetailsDemoReadBaseSchema.extend({
  competition_type: z.literal("matchmaking")
});

export function validateMatchmakingDetailsDemoReady(
  data: unknown
): MatchmakingDetailsDemoReady {
  return MatchmakingDetailsDemoReadySchema.parse(data);
}

export interface ChampionshipDetailsDemoReady extends DetailsDemoReadyBase {
  competition_type: "championship";
  round: number;
  group: number;
}

const ChampionshipDetailsDemoReadySchema = DetailsDemoReadBaseSchema.extend({
  competition_type: z.literal("championship"),
  round: z.number(),
  group: z.number()
});

export function validateChampionshipDetailsDemoReady(
  data: unknown
): ChampionshipDetailsDemoReady {
  return ChampionshipDetailsDemoReadySchema.parse(data);
}
