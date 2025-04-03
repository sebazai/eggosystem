import type { Match, MatchTeamInfo } from "@eggosystem/types";

export interface MatchInfoQuery {
  match_id: Match["id"];
  match_date: Match["match_date"];
  start_time: Match["start_time"];
  end_time: Match["end_time"];
  best_of: Match["best_of"];
  league_id: Match["league_id"];
  season_id: Match["season_id"];
  stage: Match["stage"];
  teams: string; // JSON stringified array of MatchTeamInfo
}

export interface MatchInfo {
  match_id: Match["id"];
  match_date: Match["match_date"];
  start_time: Match["start_time"];
  end_time: Match["end_time"];
  best_of: Match["best_of"];
  league_id: Match["league_id"];
  season_id: Match["season_id"];
  stage: Match["stage"];
  teams: Record<string | number, MatchTeamInfo>;
}
