import type { Match, SteamPlayer, Team } from "@eggosystem/types";
import type { MatchTeamSide } from "../matches/MatchTeamSide.types";

export interface MyTeamPlayer {
  steam_id: SteamPlayer["steam_id"];
  nickname: string;
  is_captain: boolean;
  is_co_captain: boolean;
  role: "primary" | "substitute";
}

export interface MyTeamDetails {
  team_id: Team["id"];
  team_name: string;
  team_logo: string;
  season_id: number;
  season_name: string;
  league_id: number;
  league_name: string;
  players: MyTeamPlayer[];
  external_team_id: string | null;
  platform: string | null;
}

export interface MyTeamChampionship {
  id: number;
  external_id: string;
  external_league_name: string;
  type: string;
  stage_name: string;
}

export interface MyTeamUpcomingMatch {
  match_id: Match["id"];
  team_id: Team["id"];
  team_name: string;
  team_side: MatchTeamSide;
  opponent_team_id: Team["id"];
  opponent_team_name: string;
  opponent_side: MatchTeamSide;
  start_timestamp: Match["start_timestamp"];
  season_id: Match["season_id"];
  season_name: string;
  league_id: Match["league_id"];
  league_name: string;
  best_of: Match["best_of"];
  external_match_room_id: Match["external_match_room_id"];
  status: Match["status"];
  platform: string | null;
}
