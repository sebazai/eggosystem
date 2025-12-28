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
  player_name?: Nullable<string>;
  faceit_level?: Nullable<number>;
  cs2_rank_min?: Nullable<number>;
  cs2_rank_max?: Nullable<number>;
  tier?: Nullable<number>;
}

export type SteamUserPayload = Omit<UserPayload, "roles" | "permissions">;

export interface UserPayload {
  account_id: Account["id"];
  provider_id: SteamPlayer["steam_id"];
  permissions: string[];
  roles: string[];
  nickname: SteamPlayer["nickname"];
  provider: LinkedAccount["provider"];
}

export interface UserFullPayload extends Omit<UserPayload, "permissions"> {
  acceptedPrivacyPolicy: boolean;
  acceptedMarketing: boolean;
  acceptedNewsletter: boolean;
  hasAcceptedPreviousPolicy?: boolean;
  isPersonalEmail: Account["is_work_email_personal_email"];
  discordLinked: boolean;
}

export interface UserProfilePayload {
  fullName: Account["full_name"];
  workEmail: Account["work_email"];
}

export type RequestWithParams<P> = Request<P>;
export type RequestWithQuery<Q> = Request<unknown, unknown, unknown, Q>;
export type RequestWithBody<B> = Request<unknown, unknown, B>;
export type RequestWithQueryAndBody<Q, B> = Request<unknown, unknown, B, Q>;
export type RequestWithParamsAndBody<P, B> = Request<P, unknown, B>;
export type RequestWithParamsAndQuery<P, Q> = Request<P, unknown, unknown, Q>;
export type RequestWithParamsAndQueryAndBody<P, Q, B> = Request<
  P,
  unknown,
  B,
  Q
>;

export * from "./UserPayload.test-utils";
