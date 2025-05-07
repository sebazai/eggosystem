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
  playerName?: Nullable<string>;
}

export interface UserPayload {
  account_id: Account["id"];
  provider_id: SteamPlayer["steam_id"];
  permissions: string[];
  nickname: SteamPlayer["nickname"];
  provider: LinkedAccount["provider"];
}

export interface UserFullPayload extends Omit<UserPayload, "permissions"> {
  fullName: Account["full_name"];
  workEmail: Account["work_email"];
  discord: Account["discord"];
  acceptedPrivacyPolicy: boolean;
  acceptedMarketing: boolean;
}

export type RequestWithParams<P> = Request<P>;
export type RequestWithBody<B> = Request<unknown, unknown, B>;
export type RequestWithParamsAndBody<P, B> = Request<P, unknown, B>;
export type RequestWithParamsAndQuery<P, Q> = Request<P, unknown, unknown, Q>;
