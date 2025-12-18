import type { Map } from "@eggosystem/types";

/**
 * Aggregated map veto statistics for a team
 */
export interface TeamMapVetoStats {
  map_id: number;
  map_name: Map["name"];
  picks: number; // count of 'pick' + 'decider' actions
  bans: number; // count of 'drop' actions
}
