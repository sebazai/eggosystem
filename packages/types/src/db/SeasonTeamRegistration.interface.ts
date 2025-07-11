import type { Nullable, Season, Team } from "@eggosystem/types";

export interface SeasonTeamRegistration {
  season_id: Season["id"];
  team_id: Team["id"];
  approved: boolean; // Not nullable, defaults to false (0)
  external_platform_id?: Nullable<string>;
  terms_and_conditions_approved: boolean;
}
