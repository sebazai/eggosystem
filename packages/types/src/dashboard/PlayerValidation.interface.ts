import { SeasonPlatform } from "../enums";

import { Account, SteamPlayer } from "../db";

export interface PlayerDetailsForDashboardBySteamId {
  account_id: Account["id"];
  steam_id: SteamPlayer["steam_id"];
  nickname: SteamPlayer["nickname"];
  discord: Account["discord"];
  work_email_verified: Account["work_email_verified"];
  is_valid_full_name: number;
  is_valid_work_email: number;
  work_email: Account["work_email"];
}

export interface PlayerValidationResult {
  steam_id: string;
  season_id: number;
  app_id: number;
  platform: SeasonPlatform;
  hours: {
    value: number;
    success: boolean;
    error: string | null;
  };
  rank: {
    value: number;
    success: boolean;
    error: string | null;
  };
  platform_rank: {
    value: number;
    success: boolean;
    error: string | null;
  };
  profile: {
    success: boolean;
    data: {
      account_id: Account["id"];
      nickname: Account["nickname"];
      discord: Account["discord"];
      work_email_verified: Account["work_email_verified"];
      is_valid_full_name: boolean;
      is_valid_work_email: boolean;
      work_email: Account["work_email"];
    } | null;
    error: string | null;
  };
  overall_success: boolean;
}
