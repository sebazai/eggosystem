import type {
  League,
  Season,
  Match,
  MatchGame,
  MatchTeamInfo,
  Nullable
} from "@eggosystem/types";

export interface MatchInfo {
  match_id: Match["id"];
  match_date: Match["match_date"];
  start_time: Match["start_time"];
  end_time: Match["end_time"];
  best_of: Match["best_of"];
  external_match_room_id: Match["external_match_room_id"];
  league_id: Match["league_id"];
  league_name: League["name"];
  season_id: Match["season_id"];
  season_name: Season["full_name"];
  season_platform: Season["platform"];
  stage: Match["stage"];
  teams: Record<string, MatchTeamInfo>;
  game_ids: Nullable<MatchGame["id"] | MatchGame["id"][]>;
}

export interface MatchInfoQuery extends Omit<MatchInfo, "teams" | "game_ids"> {
  teams: string; // JSON stringified array of MatchTeamInfo
  game_ids: string; // JSON stringified array of MatchGame["id"] | MatchGame["id"][]
}
