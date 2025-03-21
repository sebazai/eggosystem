import type { Player, Season, Team } from "@eggosystem/types";

export interface SeasonTeamPlayer {
  season_id: Season["id"];
  team_id: Team["id"];
  steam_id: Player["steam_id"];
  role: "primary" | "substitute";
}
