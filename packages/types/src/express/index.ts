import type { Nullable } from "../utils";

export interface ParsedParams {
  season_ids: Nullable<number[]>;
  league_ids: Nullable<number[]>;
  team_ids: Nullable<number[]>;
  stages: Nullable<number[]>;
  map_ids: Nullable<number[]>;
  leaderboard?: Nullable<string>;
}
