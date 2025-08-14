import type { League, Season } from "@eggosystem/types";

export interface SeasonLeague {
  tier: number;
  season_id: Season["id"];
  league_id: League["id"];
}
