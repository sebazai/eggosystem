import type { Nullable } from "../utils";
import type { Request } from "express";

export interface ParsedParams {
  season_ids: Nullable<number[]>;
  league_ids: Nullable<number[]>;
  team_ids: Nullable<number[]>;
  stages: Nullable<number[]>;
  map_ids: Nullable<number[]>;
  leaderboard?: Nullable<string>;
}

export interface UserPayload {
  steamId: string;
  displayName: string;
}

export type RequestWithParams<P> = Request<P>;
export type RequestWithParamsAndBody<P, B> = Request<P, unknown, B>;
export type RequestWithParamsAndQuery<P, Q> = Request<P, unknown, unknown, Q>;
