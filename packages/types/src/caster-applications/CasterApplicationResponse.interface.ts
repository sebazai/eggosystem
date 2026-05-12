import type { CasterApplication } from "./CasterApplication.interface";

export interface CasterApplicationResponse extends CasterApplication {
  organizer_name?: string;
  discord_username?: string | null;
  steam_id?: string;
  nickname?: string;
}
