export interface KanahautomoRegistration {
  id: number;
  steam_id: string; // steam_id from SteamPlayers (bigInteger)
  organization_id: number;
  status: "active" | "team_formed";
  created_at: string;
}

export interface InsertKanahautomoRegistration {
  steam_id: string; // steam_id from SteamPlayers
  organization_id: number;
  status?: "active" | "team_formed";
}
