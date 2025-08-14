import type { Season, SteamPlayer, Team } from "@eggosystem/types";

export interface SeasonTeamRegistrationPlayer {
  season_id: Season["id"];
  team_id: Team["id"];
  steam_id: SteamPlayer["steam_id"];
  is_captain: boolean;
  is_co_captain: boolean;
}
