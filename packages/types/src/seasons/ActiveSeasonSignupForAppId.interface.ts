import { Season } from "../db";

export interface ActiveSeasonSignupForAppId {
  season_id: Season["id"];
  platform: Season["platform"];
  signup_end_date: Season["signup_end_date"];
  full_name: Season["full_name"];
}
