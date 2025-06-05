import { Season } from "../db";
import { SeasonTeamRegistration } from "../db/SeasonTeamRegistration.interface";
import { Team } from "../db/Team.interface";

interface RegisteredTeamPlayer {
  steam_id: string;
  nickname: string;
}

export interface SeasonRegisteredTeamsWithPlayers
  extends SeasonTeamRegistration {
  team_name: Team["name"];
  captain_nickname: string;
  co_captain_nickname: string;
  season_platform: Season["platform"];
  players: RegisteredTeamPlayer[];
}
