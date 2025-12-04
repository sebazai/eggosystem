import type { Match, SteamPlayer } from "../db";

export interface InsertSeasonTeamPlayer {
  steam_id: SteamPlayer["steam_id"];
  role?: "primary" | "substitute";
  match_id?: Match["id"];
  replaces_steam_id?: SteamPlayer["steam_id"]; // For substitutes: which player they replace
  ticket_number?: string; // Helpdesk ticket reference for audit trail
}
