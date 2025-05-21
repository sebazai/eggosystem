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
  league_id: Match["league_id"];
  league_name: League["name"];
  season_id: Match["season_id"];
  season_name: Season["full_name"];
  stage: Match["stage"];
  teams: Record<string | number, MatchTeamInfo>;
  game_id: Nullable<MatchGame["id"]>;
}

export interface MatchInfoQuery extends Omit<MatchInfo, "teams"> {
  teams: string; // JSON stringified array of MatchTeamInfo
}
