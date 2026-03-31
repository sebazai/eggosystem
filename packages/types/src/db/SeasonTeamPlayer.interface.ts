import type {
  SteamPlayer,
  Season,
  Team,
  Nullable,
  Match
} from "@eggosystem/types";

export interface SeasonTeamPlayer {
  season_id: Season["id"];
  team_id: Team["id"];
  steam_id: SteamPlayer["steam_id"];
  role: "primary" | "substitute";
  is_captain: boolean;
  is_co_captain: boolean;
  match_id: Nullable<Match["id"]>;
  /** For substitute rows: primary player this sub replaces for `match_id`. */
  replaces_steam_id: Nullable<SteamPlayer["steam_id"]>;
  discarded_at: Nullable<Date>;
  discarded_by: Nullable<number>;
}
