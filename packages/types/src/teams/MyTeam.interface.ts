import type { SteamPlayer, Team } from "@eggosystem/types";

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

export interface MyTeamUpcomingMatch {
  match_id: number;
  team_id: Team["id"];
  team_name: string;
  opponent_team_id: Team["id"];
  opponent_team_name: string;
  match_date: string;
  start_time: string;
  season_id: number;
  season_name: string;
  league_id: number;
  league_name: string;
  best_of: number;
  external_match_room_id: string | null;
  status: string;
  platform: string | null;
}
