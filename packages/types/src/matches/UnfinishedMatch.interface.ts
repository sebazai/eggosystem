import type { Match, League } from "@eggosystem/types";

export interface UnfinishedMatch {
  match_id: Match["id"];
  label: string;
  best_of: Match["best_of"];
  status: Match["status"];
  start_timestamp: Match["start_timestamp"];
}

export interface UnfinishedMatchQuery {
  match_id: Match["id"];
  league_name: League["name"];
  team1_name: string;
  team2_name: string;
  best_of: Match["best_of"];
  status: Match["status"];
  start_timestamp: Match["start_timestamp"];
}
