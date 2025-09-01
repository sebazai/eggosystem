import { z } from "zod";
import {
  FaceitMatchTeams,
  FaceitMatchStatus,
  FaceitMatchTeamsSchema
} from "./Details.interface";

interface DetailsConfiguringBase {
  match_id: string;
  version: number;
  game: string;
  region: string;
  competition_id: string;
  competition_name: string;
  organizer_id: string;
  teams: FaceitMatchTeams;
  calculate_elo: boolean;
  chat_room_id: string;
  best_of: number;
  status: typeof FaceitMatchStatus.CONFIGURING | typeof FaceitMatchStatus.READY;
  faceit_url: string;
  configured_at: number;
}

const DetailsConfiguringBaseSchema = z.object({
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
  status: z
    .literal(FaceitMatchStatus.CONFIGURING)
    .or(z.literal(FaceitMatchStatus.READY)),
  faceit_url: z.string(),
  configured_at: z.number()
});

export interface MatchmakingDetailsConfiguring extends DetailsConfiguringBase {
  competition_type: "matchmaking";
}

const MatchmakingDetailsConfiguringSchema = z.object({
  ...DetailsConfiguringBaseSchema.shape,
  competition_type: z.literal("matchmaking")
});

export function validateMatchmakingDetailsConfiguring(
  data: unknown
): MatchmakingDetailsConfiguring {
  return MatchmakingDetailsConfiguringSchema.parse(data);
}

interface ChampionshipDetailsConfiguringBase extends DetailsConfiguringBase {
  competition_type: "championship";
  round: number;
  group: number;
}

export interface ChampionshipDetailsConfiguring
  extends ChampionshipDetailsConfiguringBase {
  status: typeof FaceitMatchStatus.CONFIGURING;
}

const ChampionshipDetailsConfiguringBaseSchema = z.object({
  ...DetailsConfiguringBaseSchema.shape,
  competition_type: z.literal("championship"),
  round: z.number(),
  group: z.number()
});

const ChampionshipDetailsConfiguringSchema = z.object({
  ...ChampionshipDetailsConfiguringBaseSchema.shape,
  status: z
    .literal(FaceitMatchStatus.CONFIGURING)
    .or(z.literal(FaceitMatchStatus.READY))
});

export function validateChampionshipDetailsConfiguring(data: unknown) {
  return ChampionshipDetailsConfiguringSchema.parse(data);
}
