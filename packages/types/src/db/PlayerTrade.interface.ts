import type { MatchGame, SteamPlayer } from "@eggosystem/types";

export interface PlayerTrade {
  id: number;
  game_id: MatchGame["id"];
  trader_steam_id: SteamPlayer["steam_id"]; // steam_id as string
  killer_steam_id: SteamPlayer["steam_id"]; // steam_id as string
  victim_steam_id: SteamPlayer["steam_id"]; // steam_id as string
  round_number: number; // TINYINT UNSIGNED as number
  first_death: boolean; // TINYINT(1) as boolean
  traded: boolean; // TINYINT(1) as boolean
  attempted: boolean; // TINYINT(1) as boolean
  time: string | null; // BIGINT UNSIGNED, can be null
  trade_time: bigint | null; // BIGINT UNSIGNED, can be null
  death_time: bigint | null; // BIGINT UNSIGNED, can be null
}
