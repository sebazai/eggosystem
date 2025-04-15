import type { SteamPlayer, Season, Team } from "@eggosystem/types";

export interface SeasonTeamPlayer {
  season_id: Season["id"];
  team_id: Team["id"];
  steam_id: SteamPlayer["steam_id"];
  role: "primary" | "substitute";
}
