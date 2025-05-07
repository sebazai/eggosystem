import { Nullable } from "../utils";

export interface UpdateSeasonTeamRegistration {
  captain_steam_id: string;
  co_captain_steam_id: string;
  external_platform_id?: Nullable<string>;
  terms_and_conditions_approved: boolean;
}
