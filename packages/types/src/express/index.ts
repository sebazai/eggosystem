import type { Player, Nullable } from "@eggosystem/types";
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
  steamId: Player["steam_id"];
  displayName: Player["name"];
}

export interface UserFullPayload extends UserPayload {
  fullName: Player["player_name"];
  workEmail: Player["work_email"];
  discord: Player["discord"];
  acceptedPrivacyPolicy: boolean;
  acceptedMarketing: boolean;
}

export type RequestWithParams<P> = Request<P>;
export type RequestWithBody<B> = Request<unknown, unknown, B>;
export type RequestWithParamsAndBody<P, B> = Request<P, unknown, B>;
export type RequestWithParamsAndQuery<P, Q> = Request<P, unknown, unknown, Q>;
