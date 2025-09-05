import { SeasonLeague } from "./SeasonLeague.interface";
import { Stage } from "./Stage.interface";

export type SeasonLeagueExternalId = {
  id: number;
  external_id: string;
  external_league_name: string;
  isBO2PlayedAs2xBO1: boolean;
  stage_id: Stage["id"];
  season_id: SeasonLeague["season_id"];
  league_id: SeasonLeague["league_id"];
  type: "roundRobin" | "doubleElimination" | "singleElimination";
  manual_group?: number;
};
