import { Account, Season, SteamPlayer } from "../db";
import { SeasonTeamRegistration } from "../db/SeasonTeamRegistration.interface";
import { Team } from "../db/Team.interface";

export interface RegisteredTeamPlayer {
  steam_id: SteamPlayer["steam_id"];
  nickname: SteamPlayer["nickname"];
  work_email: string;
  is_work_email_personal_email: Account["is_work_email_personal_email"];
  work_email_verified: Account["work_email_verified"];
}

export interface SeasonRegisteredTeamsWithPlayers
  extends SeasonTeamRegistration {
  team_id: Team["id"];
  season_id: Season["id"];
  team_name: Team["name"];
  captain_nickname: string;
  co_captain_nickname: string;
  season_platform: Season["platform"];
  players: RegisteredTeamPlayer[];
}

export interface SeasonRegisteredTeamsWithPlayersValidatedTeams
  extends SeasonRegisteredTeamsWithPlayers {
  is_valid: boolean;
  invalid_players: Array<RegisteredTeamPlayer>;
}
