import { SeasonPlatform } from "../enums";

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
      account_id: number;
      nickname: string;
      discord: string;
      work_email_verified: boolean;
      is_valid_full_name: boolean;
      is_valid_work_email: boolean;
    } | null;
    error: string | null;
  };
  overall_success: boolean;
}
