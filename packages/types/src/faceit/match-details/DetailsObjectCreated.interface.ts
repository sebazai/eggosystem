import { z } from "zod";
import {
  FaceitGame,
  FaceitMatchTeams,
  FaceitMatchStatus,
  FaceitGameSchema,
  FaceitMatchTeamsSchema
} from "./Details.interface";

interface DetailsObjectCreatedBase {
  match_id: string;
  version: number;
  game: FaceitGame;
  region: string;
  competition_id: string;
  competition_name: string;
  calculate_elo: boolean;
  chat_room_id: string;
  best_of: number;
  faceit_url: string;
}

interface MatchmakingDetailsObjectCreatedBase extends DetailsObjectCreatedBase {
  organizer_id: "faceit";
  competition_type: "matchmaking";
}

interface MatchmakingDetailsObjectCreatedCheckIn
  extends MatchmakingDetailsObjectCreatedBase {
  teams: unknown; // {}
  status: FaceitMatchStatus.CHECK_IN;
}

interface MatchmakingDetailsObjectCreatedVoting
  extends MatchmakingDetailsObjectCreatedBase {
  teams: FaceitMatchTeams;
  status: FaceitMatchStatus.VOTING;
}

export type MatchmakingDetailsObjectCreated =
  | MatchmakingDetailsObjectCreatedCheckIn
  | MatchmakingDetailsObjectCreatedVoting;

const MatchmakingDetailsObjectCreatedBaseSchema = z.object({
  match_id: z.string(),
  version: z.number(),
  game: FaceitGameSchema,
  region: z.string(),
  competition_id: z.string(),
  competition_type: z.literal("matchmaking"),
  competition_name: z.string(),
  organizer_id: z.literal("faceit"),
  calculate_elo: z.boolean(),
  chat_room_id: z.string(),
  best_of: z.number(),
  faceit_url: z.string()
});

const MatchmakingDetailsObjectCreatedCheckInSchema = z.object({
  status: z.literal(FaceitMatchStatus.CHECK_IN),
  teams: z.object({}),
  ...MatchmakingDetailsObjectCreatedBaseSchema.shape
});

const MatchmakingDetailsObjectCreatedVotingSchema = z.object({
  status: z.literal(FaceitMatchStatus.VOTING),
  teams: FaceitMatchTeamsSchema,
  ...MatchmakingDetailsObjectCreatedBaseSchema.shape
});

const MatchmakingDetailsObjectCreatedSchema = z.discriminatedUnion("status", [
  MatchmakingDetailsObjectCreatedCheckInSchema,
  MatchmakingDetailsObjectCreatedVotingSchema
]);

export function validateMatchmakingDetailsObjectCreated(
  data: unknown
): MatchmakingDetailsObjectCreated {
  return MatchmakingDetailsObjectCreatedSchema.parse(data);
}

interface ChampionshipDetailsObjectCreatedBase
  extends DetailsObjectCreatedBase {
  organizer_id: string;
  competition_type: "championship";
  round: number;
  group: number;
}

interface ChampionshipDetailsObjectCreatedCheckIn
  extends ChampionshipDetailsObjectCreatedBase {
  teams: unknown; // {}
  status: FaceitMatchStatus.CHECK_IN;
}

export interface ChampionshipDetailsObjectCreatedVoting
  extends ChampionshipDetailsObjectCreatedBase {
  teams: FaceitMatchTeams;
  status: FaceitMatchStatus.VOTING;
  scheduled_at?: number;
}

interface ChampionshipDetailsObjectCreatedScheduled
  extends ChampionshipDetailsObjectCreatedBase {
  teams: FaceitMatchTeams;
  status: FaceitMatchStatus.SCHEDULED;
  scheduled_at: number;
}

interface ChampionshipDetailsObjectCreatedOnGoing
  extends ChampionshipDetailsObjectCreatedBase {
  teams: FaceitMatchTeams;
  status: FaceitMatchStatus.ONGOING;
  scheduled_at?: number;
}

interface ChampionshipDetailsObjectCreatedFinished
  extends ChampionshipDetailsObjectCreatedBase {
  teams: FaceitMatchTeams;
  status: FaceitMatchStatus.FINISHED;
  scheduled_at?: number;
}

export type ChampionshipDetailsObjectCreated =
  | ChampionshipDetailsObjectCreatedCheckIn
  | ChampionshipDetailsObjectCreatedVoting
  | ChampionshipDetailsObjectCreatedScheduled
  | ChampionshipDetailsObjectCreatedOnGoing
  | ChampionshipDetailsObjectCreatedFinished;

const ChampionshipDetailsObjectCreatedBaseSchema = z.object({
  ...MatchmakingDetailsObjectCreatedBaseSchema.shape,
  organizer_id: z.string(),
  competition_type: z.literal("championship"),
  round: z.number(),
  group: z.number()
});

const ChampionshipDetailsObjectCreatedCheckInSchema = z.object({
  status: z.literal(FaceitMatchStatus.CHECK_IN),
  teams: z.object({}),
  ...ChampionshipDetailsObjectCreatedBaseSchema.shape
});

const ChampionshipDetailsObjectCreatedVotingSchema = z.object({
  status: z.literal(FaceitMatchStatus.VOTING),
  teams: FaceitMatchTeamsSchema,
  ...ChampionshipDetailsObjectCreatedBaseSchema.shape
});

const ChampionshipDetailsObjectCreatedScheduledSchema = z.object({
  status: z.literal(FaceitMatchStatus.SCHEDULED),
  teams: FaceitMatchTeamsSchema,
  scheduled_at: z.number(),
  ...ChampionshipDetailsObjectCreatedBaseSchema.shape
});

const ChampionshipDetailsObjectCreatedOnGoingSchema = z.object({
  status: z.literal(FaceitMatchStatus.ONGOING),
  teams: FaceitMatchTeamsSchema,
  ...ChampionshipDetailsObjectCreatedBaseSchema.shape
});

const ChampionshipDetailsObjectCreatedFinishedSchema = z.object({
  status: z.literal(FaceitMatchStatus.FINISHED),
  teams: FaceitMatchTeamsSchema,
  ...ChampionshipDetailsObjectCreatedBaseSchema.shape
});

const ChampionshipDetailsObjectCreatedSchema = z.discriminatedUnion("status", [
  ChampionshipDetailsObjectCreatedCheckInSchema,
  ChampionshipDetailsObjectCreatedVotingSchema,
  ChampionshipDetailsObjectCreatedScheduledSchema,
  ChampionshipDetailsObjectCreatedFinishedSchema,
  ChampionshipDetailsObjectCreatedOnGoingSchema
]);

export function validateChampionshipDetailsObjectCreated(
  data: unknown
): ChampionshipDetailsObjectCreated {
  return ChampionshipDetailsObjectCreatedSchema.parse(data);
}
