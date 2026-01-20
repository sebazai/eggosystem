import type { League, Season, Match, MatchTeamInfo } from "@eggosystem/types";

export interface MatchesWithTeamData {
  match_id: Match["id"];
  start_timestamp: Match["start_timestamp"];
  end_timestamp: Match["end_timestamp"];
  best_of: Match["best_of"];
  external_match_room_id: Match["external_match_room_id"];
  league_id: Match["league_id"];
  league_name: League["name"];
  season_id: Match["season_id"];
  season_name: Season["full_name"];
  season_platform: Season["platform"];
  stage: Match["stage"];
  teams: Record<string, MatchTeamInfo>;
}

export interface MatchesWithTeamDataQuery extends Omit<
  MatchesWithTeamData,
  "teams"
> {
  teams: string; // JSON stringified array of MatchTeamInfo
}
