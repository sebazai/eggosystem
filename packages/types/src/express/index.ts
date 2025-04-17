import type {
  SteamPlayer,
  Nullable,
  Account,
  LinkedAccount
} from "@eggosystem/types";
import type { Request } from "express";

export interface ParsedParams {
  season_ids: Nullable<number[]>;
  league_ids: Nullable<number[]>;
  team_ids: Nullable<number[]>;
  stages: Nullable<number[]>;
  map_ids: Nullable<number[]>;
  steam_ids?: Nullable<string[]>;
  leaderboards?: Nullable<string>;
}

export interface UserPayload {
  account_id: Account["id"];
  provider_id: SteamPlayer["steam_id"];
  nickname: SteamPlayer["nickname"];
  provider: LinkedAccount["provider"];
}

export interface UserFullPayload extends UserPayload {
  fullName: Account["full_name"];
  workEmail: Account["work_email"];
  email: Account["email"];
  discord: Account["discord"];
  acceptedPrivacyPolicy: boolean;
  acceptedMarketing: boolean;
}

export type RequestWithParams<P> = Request<P>;
export type RequestWithBody<B> = Request<unknown, unknown, B>;
export type RequestWithParamsAndBody<P, B> = Request<P, unknown, B>;
export type RequestWithParamsAndQuery<P, Q> = Request<P, unknown, unknown, Q>;
