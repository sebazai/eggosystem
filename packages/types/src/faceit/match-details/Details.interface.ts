export enum FaceitGame {
  CS2 = "cs2",
  CSGO = "csgo"
}

export enum FaceitMatchStatus {
  CREATED = "CREATED",
  VOTING = "VOTING",
  CONFIGURING = "CONFIGURING",
  READY = "READY",
  ONGOING = "ONGOING",
  FINISHED = "FINISHED",
  ABORTED = "ABORTED",
  CANCELLED = "CANCELLED"
}

// Player roster member interface
export interface FaceitPlayerRoster {
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
  type: "premade";
}

// Teams container interface
export interface FaceitMatchTeams {
  faction1: FaceitTeamFaction;
  faction2: FaceitTeamFaction;
}

// Map voting interface
export interface FaceitMapVoting {
  pick: string[];
  entities: FaceitMapEntity[];
}

export interface FaceitLocationVoting {
  pick: string[];
  entities: FaceitLocationEntity[];
}

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
