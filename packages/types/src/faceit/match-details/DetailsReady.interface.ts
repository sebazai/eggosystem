import { z } from "zod";
import {
  FaceitGame,
  FaceitMatchTeams,
  FaceitGameSchema,
  FaceitMatchStatus,
  FaceitMatchTeamsSchema,
  FaceitVoting,
  FaceitVotingSchema
} from "./Details.interface";

interface DetailsReadyBase {
  match_id: string;
  version: number;
  game: FaceitGame;
  region: string;
  competition_id: string;
  competition_name: string;
  organizer_id: string;
  voting: FaceitVoting;
  teams: FaceitMatchTeams;
  calculate_elo: boolean;
  chat_room_id: string;
  best_of: number;
  status: FaceitMatchStatus.READY;
  faceit_url: string;
  configured_at: number;
}

const DetailsReadyBaseSchema = z.object({
  match_id: z.string(),
  version: z.number(),
  game: FaceitGameSchema,
  region: z.string(),
  competition_id: z.string(),
  competition_name: z.string(),
  organizer_id: z.string(),
  voting: FaceitVotingSchema,
  teams: FaceitMatchTeamsSchema,
  calculate_elo: z.boolean(),
  chat_room_id: z.string(),
  best_of: z.number(),
  status: z.literal(FaceitMatchStatus.READY),
  faceit_url: z.string(),
  configured_at: z.number()
});

export interface MatchmakingDetailsReady extends DetailsReadyBase {
  competition_type: "matchmaking";
}

const MatchmakingDetailsReadySchema = z.object({
  ...DetailsReadyBaseSchema.shape,
  competition_type: z.literal("matchmaking")
});

export function validateMatchmakingDetailsReady(
  data: unknown
): MatchmakingDetailsReady {
  return MatchmakingDetailsReadySchema.parse(data);
}

export interface ChampionshipDetailsReady extends DetailsReadyBase {
  competition_type: "championship";
  round: number;
  group: number;
}

const ChampionshipDetailsReadySchema = z.object({
  ...DetailsReadyBaseSchema.shape,
  competition_type: z.literal("championship"),
  round: z.number(),
  group: z.number()
});

export function validateChampionshipDetailsReady(data: unknown) {
  return ChampionshipDetailsReadySchema.parse(data);
}
