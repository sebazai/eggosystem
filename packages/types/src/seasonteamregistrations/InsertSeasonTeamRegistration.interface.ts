import type { SeasonTeamRegistration } from "@eggosystem/types";

export interface InsertSeasonTeamRegistration {
  external_platform_id: SeasonTeamRegistration["external_platform_id"];
  terms_and_conditions_approved: SeasonTeamRegistration["terms_and_conditions_approved"];
}
