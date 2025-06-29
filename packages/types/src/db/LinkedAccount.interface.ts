import { Account } from "./Account.interface";

export interface LinkedAccount {
  account_id: Account["id"];
  provider: "steam" | "discord";
  provider_id: string;
}
