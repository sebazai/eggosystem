import { SteamPlayer, PlayerStats, SeasonTeamPlayer } from "@eggosystem/types";

export interface MatchTopPlayersQueryResult<T extends keyof PlayerStats> {
  steam_id: SteamPlayer["steam_id"];
  nickname: SteamPlayer["nickname"];
  value: PlayerStats[T];
  team_id: SeasonTeamPlayer["team_id"];
}
