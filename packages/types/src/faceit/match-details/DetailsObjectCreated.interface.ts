import { z } from "zod";
import {
  FaceitGame,
  FaceitMatchTeams,
  FaceitMatchStatus,
  BaseMatchDetailsSchema,
  FaceitGameSchema,
  FaceitMatchStatusSchema
} from "./Details.interface";

export interface DetailsObjectCreated {
  match_id: string;
  version: number;
  game: FaceitGame;
  region: string;
  competition_id: string;
  competition_type: string;
  competition_name: string;
  organizer_id: string;
  teams: FaceitMatchTeams;
  calculate_elo: boolean;
  chat_room_id: string;
  best_of: number;
  status: FaceitMatchStatus;
  round?: number; // Optional since not always present
  group?: number; // Optional since not always present
  faceit_url: string;
}

// Zod schemas for runtime validation
export const DetailsObjectCreatedSchema = BaseMatchDetailsSchema.extend({
  game: FaceitGameSchema,
  status: FaceitMatchStatusSchema,
  round: z.number().optional(),
  group: z.number().optional()
});

// Runtime validation function
export function validateDetailsObjectCreated(
  data: unknown
): DetailsObjectCreated {
  return DetailsObjectCreatedSchema.parse(data);
}
