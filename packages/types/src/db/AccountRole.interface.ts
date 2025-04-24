import { Account } from "./Account.interface";
import { Game } from "./Game.interface";
import { Role } from "./Role.interface";

export interface AccountRole {
  account_id: Account["id"];
  role_id: Role["id"];
  game_id: Game["id"];
  created_at: string;
  updated_at: string;
}
