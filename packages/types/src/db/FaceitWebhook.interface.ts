export interface FaceitWebhook {
  id: number;
  received_at: string;
  external_match_room_id: string;
  event: string;
  data: string;
  details: string;
  error_type: string | null;
  error_details: string | null;
}
