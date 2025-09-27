import {
  League,
  Match,
  MatchGame,
  Season,
  SeasonTeamPlayer,
  Team,
  TeamGameScore
} from "../db";
import { Nullable } from "../utils";

export type MatchHistoryResult = {
  match_id: Match["id"];
  match_game_id: Nullable<MatchGame["id"]>;
  map_name: string;
  best_of: Match["best_of"];
  season_id: Match["season_id"];
  season_name: Season["full_name"];
  league_id: Match["league_id"];
  league_name: League["name"];
  stage: Match["stage"];
  match_date: Match["match_date"];
  team_id: SeasonTeamPlayer["team_id"];
  team_name: Team["name"];
  team_logo: Team["team_logo"];
  score: number;
  opponent_id: TeamGameScore["team_id"];
  opponent_name: Team["name"];
  opponent_logo: Team["team_logo"];
  opponent_score: number;
  kills: number;
  deaths: number;
  assists: number;
  flash_assists: number;
  awp_kills: number;
  utility_damage: number;
  headshots: number;
  first_kills: number;
  first_deaths: number;
  kast: number;
  adr: number;
  hs_percent: number;
  kana_rating: number;
  kd: number;
};
