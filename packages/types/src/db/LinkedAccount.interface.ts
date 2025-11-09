import { Account } from "./Account.interface";
import type { Nullable } from "../utils";

export interface LinkedAccount {
  account_id: Account["id"];
  provider: "steam" | "discord";
  provider_id: string;
  provider_username: Nullable<string>;
}
