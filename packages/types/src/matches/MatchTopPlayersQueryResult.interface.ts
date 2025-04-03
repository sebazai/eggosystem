import { Player, PlayerStats, SeasonTeamPlayer } from "@eggosystem/types";

export interface MatchTopPlayersQueryResult<T extends keyof PlayerStats> {
  name: Player["name"];
  value: PlayerStats[T];
  team_id: SeasonTeamPlayer["team_id"];
}
