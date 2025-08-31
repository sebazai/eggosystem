import type { Match } from "@eggosystem/types";

export interface Reservation {
  id: number;
  stream_url: string; // VARCHAR(255)
  hash: string; // VARCHAR(255)
  match_id: Match["id"]; // Match ID
  account_id?: number; // Account ID of the caster (nullable, added by migration)
}
