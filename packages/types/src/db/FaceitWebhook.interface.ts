export interface FaceitWebhook {
  id: number;
  /**
   * Webhook reception timestamp in UTC, ISO 8601 format with 'Z' indicator (e.g., '2025-01-15T10:30:00.000Z')
   * Stored as TIMESTAMP in database (UTC). Returned as Date object from models, serialized to ISO string by Express res.json()
   */
  received_at: string;
  external_payload_id: string;
  event: string;
  data: string;
  details: string;
  error_type: string | null;
  error_details: string | null;
}
