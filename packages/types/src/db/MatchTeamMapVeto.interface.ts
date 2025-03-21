import type { Match, Team, Map } from "@eggosystem/types";

export interface MatchTeamMapVeto {
  id: number;
  match_id: Match["id"];
  team_id: Team["id"];
  map_id: Map["id"]; // TINYINT UNSIGNED stored as number
  action: "drop" | "pick" | "decider";
  veto_order: number; // TINYINT UNSIGNED stored as number
}
