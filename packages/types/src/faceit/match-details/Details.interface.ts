import { z } from "zod";

export enum FaceitGame {
  CS2 = "cs2",
  CSGO = "csgo"
}

export enum FaceitMatchStatus {
  SCHEDULED = "SCHEDULED",
  CHECK_IN = "CHECK_IN",
  VOTING = "VOTING",
  CONFIGURING = "CONFIGURING",
  READY = "READY",
  ONGOING = "ONGOING",
  FINISHED = "FINISHED",
  ABORTED = "ABORTED",
  CANCELLED = "CANCELLED"
}

// Player roster member interface
interface FaceitPlayerRoster {
  player_id: string; // Faceit player id
  nickname: string; // Faceit nickname
  avatar: string;
  membership: string;
  game_player_id: string; // Steam id
  game_player_name: string; // Steam nickname
  game_skill_level: number; // ??? Perhaps Faceit skill level
  anticheat_required: boolean;
}

// Team faction interface
export interface FaceitTeamFaction {
  faction_id: string;
  leader: string; // Faceit player id
  avatar: string;
  roster: FaceitPlayerRoster[];
  substituted: boolean;
  name: string;
  type: "premade" | ""; // Allow empty string for early match states
}

// Teams container interface
export interface FaceitMatchTeams {
  faction1: FaceitTeamFaction;
  faction2: FaceitTeamFaction;
}

interface FaceitMapVoting {
  pick: string[];
  entities: FaceitMapEntity[];
}

interface FaceitLocationVoting {
  pick: string[];
  entities: FaceitLocationEntity[];
}

export interface FaceitVoting {
  map: FaceitMapVoting;
  voted_entity_types: string[];
  location: FaceitLocationVoting;
}

const FaceitMapEntitySchema = z.object({
  image_sm: z.string(),
  name: z.string(),
  class_name: z.string(),
  game_map_id: z.string(),
  guid: z.string(),
  image_lg: z.string()
});

const FaceitLocationEntitySchema = z.object({
  image_sm: z.string(),
  name: z.string(),
  class_name: z.string(),
  game_location_id: z.string(),
  guid: z.string(),
  image_lg: z.string()
});

const FaceitMapVotingSchema = z.object({
  pick: z.array(z.string()),
  entities: z.array(FaceitMapEntitySchema)
});

const FaceitLocationVotingSchema = z.object({
  pick: z.array(z.string()),
  entities: z.array(FaceitLocationEntitySchema)
});

export const FaceitVotingSchema = z.object({
  map: FaceitMapVotingSchema,
  voted_entity_types: z.array(z.string()),
  location: FaceitLocationVotingSchema
});

export interface FaceitMatchResultsAbortedAndCancelled {
  winner: "";
  score: object;
}

export interface FaceitDetailedResultsAbortedAndCancelled {
  asc_score: boolean;
  winner: "";
  factions: object;
}

// Match results interface for finished matches (with actual data)
export interface FaceitMatchResultsFinished {
  winner: string;
  score: FaceitFactionScores;
}

// Detailed results interface for finished matches (with actual data)
export interface FaceitDetailedResultsFinished {
  asc_score: boolean;
  winner: string;
  factions: Record<string, FaceitFactionScore>;
}

// Score breakdown interface for faction scores
interface FaceitFactionScores {
  faction1: number;
  faction2: number;
}

// Faction score interface for detailed results
interface FaceitFactionScore {
  score: number;
}

// Map entity interface for voting
interface FaceitMapEntity {
  image_sm: string;
  name: string;
  class_name: string;
  game_map_id: string;
  guid: string;
  image_lg: string;
}

interface FaceitLocationEntity {
  image_sm: string;
  name: string;
  class_name: string;
  game_location_id: string;
  guid: string;
  image_lg: string;
}

export const FaceitGameSchema = z.nativeEnum(FaceitGame);

const FaceitPlayerRosterSchema = z.object({
  player_id: z.string(),
  nickname: z.string(),
  avatar: z.string(),
  membership: z.string(),
  game_player_id: z.string(),
  game_player_name: z.string(),
  game_skill_level: z.number(),
  anticheat_required: z.boolean()
});

const FaceitTeamFactionSchema = z.object({
  faction_id: z.string(),
  leader: z.string(),
  avatar: z.string(),
  roster: z.array(FaceitPlayerRosterSchema),
  substituted: z.boolean(),
  name: z.string(),
  type: z.union([z.literal("premade"), z.literal("")]) // Allow both "premade" and empty string
});

export const FaceitMatchTeamsSchema = z.object({
  faction1: FaceitTeamFactionSchema,
  faction2: FaceitTeamFactionSchema
});

const FaceitFactionScoresSchema = z.object({
  faction1: z.number(),
  faction2: z.number()
});

const FaceitFactionScoreSchema = z.object({
  score: z.number()
});

export const FaceitMatchResultsAbortedAndCancelledSchema = z.object({
  winner: z.literal(""),
  score: z.object({})
});

export const FaceitDetailedResultsAbortedAndCancelledSchema = z.object({
  asc_score: z.boolean(),
  winner: z.literal(""),
  factions: z.object({})
});

export const FaceitMatchResultsFinishedSchema = z.object({
  winner: z.string(),
  score: FaceitFactionScoresSchema
});

export const FaceitDetailedResultsFinishedSchema = z.object({
  asc_score: z.boolean(),
  winner: z.string(),
  factions: z.record(FaceitFactionScoreSchema)
});
