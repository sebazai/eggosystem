import type { Season } from "@eggosystem/types";

export interface SeasonLeague {
  id: number;
  name: string;
  tier: number;
  season_id: Season["id"];
}
