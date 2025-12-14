import type { SeasonLeagueExternalId, Stage } from "../../db";

export interface SeasonLeagueWithMappings {
  season_id: number;
  league_id: number;
  tier: number;
  league_name: string;
  mappings_count: number;
  mappings: Array<SeasonLeagueExternalId> | null;
}

export interface SeasonLeagueExternalIdWithStage extends SeasonLeagueExternalId {
  stage_name: string;
}

export interface CreateSeasonLeagueExternalIdRequest {
  season_id: number;
  league_id: number;
  external_id: string;
  external_league_name: string;
  stage_id: Stage["id"];
  type: "roundRobin" | "doubleElimination" | "singleElimination";
  manual_group: number | null;
}

export interface UpdateSeasonLeagueExternalIdRequest {
  external_id: string;
  external_league_name: string;
  stage_id: Stage["id"];
  type: "roundRobin" | "doubleElimination" | "singleElimination";
  manual_group: number | null;
}

export interface UpdateLeagueNameRequest {
  name: string;
}
