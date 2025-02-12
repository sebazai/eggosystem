export interface MatchTeamMapVeto {
  id: number;
  match_id: number;
  team_id: number;
  map_id: number; // TINYINT UNSIGNED stored as number
  action: "drop" | "pick" | "decider";
  veto_order: number; // TINYINT UNSIGNED stored as number
}
