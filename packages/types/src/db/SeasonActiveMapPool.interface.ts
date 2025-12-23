import type { Season, Map } from "@eggosystem/types";

export interface SeasonActiveMapPool {
  season_id: Season["id"];
  map_id: Map["id"];
}
