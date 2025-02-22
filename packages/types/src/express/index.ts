/* eslint-disable @typescript-eslint/no-namespace */
import type { Nullable } from "../utils";

export interface ParsedParams {
  season_id: Nullable<number>;
  league_id: Nullable<number>;
  team_id: Nullable<number>;
  stage: Nullable<number>;
  map_id: Nullable<number>;
  leaderboard?: Nullable<string>;
}
