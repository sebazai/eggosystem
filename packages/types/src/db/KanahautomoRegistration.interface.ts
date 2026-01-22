export interface KanahautomoRegistration {
  id: number;
  steam_id: string; // steam_id from SteamPlayers (bigInteger)
  organization_id: number;
  accepted_terms: boolean;
  /**
   * Creation timestamp in UTC, ISO 8601 format with 'Z' indicator (e.g., '2025-01-15T10:30:00.000Z')
   * Stored as TIMESTAMP in database (UTC). Returned as Date object from models, serialized to ISO string by Express res.json()
   */
  created_at: string;
}
