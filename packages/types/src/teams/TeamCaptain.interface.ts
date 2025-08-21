import type { Nullable } from "../utils";
import type { Team } from "../db";

export interface TeamCaptain {
  team_id: Team["id"];
  team_name: Team["name"];
  captain_discord: Nullable<string>;
  co_captain_discord: Nullable<string>;
}
