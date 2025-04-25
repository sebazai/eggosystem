import type { SteamPlayer, Season, Team, Nullable } from "@eggosystem/types";

export interface SeasonTeamPlayer {
  season_id: Season["id"];
  team_id: Team["id"];
  steam_id: SteamPlayer["steam_id"];
  role: "primary" | "substitute";
  employment_approved_by_organizer: Nullable<boolean>;
}
