import type { Team, LinkedAccount } from "../db";

export interface TeamCaptain {
  team_id: Team["id"];
  team_name: Team["name"];
  captain_discord: LinkedAccount["provider_username"];
  co_captain_discord: LinkedAccount["provider_username"];
}
