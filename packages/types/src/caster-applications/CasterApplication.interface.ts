export interface CasterApplication {
  id: number;
  organizer_id: number;
  account_id: number;
  caster_url: string | null;
  approved_terms_and_conditions: boolean;
  approved_by: number | null;
  approved_at: string | null;
  rejected_by: number | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}
