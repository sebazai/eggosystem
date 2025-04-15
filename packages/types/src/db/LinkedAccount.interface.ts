import { Account } from "./Account.interface";

export interface LinkedAccount {
  account_id: Account["id"];
  provider: "steam";
  provider_id: string;
}
