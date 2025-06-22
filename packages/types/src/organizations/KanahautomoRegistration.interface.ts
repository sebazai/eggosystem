import type { InsertOrganization } from "./InsertOrganization.interface";

export interface KanahautomoRegistration {
  organization_id?: number; // If provided, use existing organization
  new_organization?: InsertOrganization; // If provided, create new organization
}

export interface KanahautomoRegistrationResponse {
  message: string;
  registration_id: number;
  organization_id: number;
}

export interface KanahautomoRegistrationRecord {
  id: number;
  steam_id: string;
  organization_id: number;
  accepted_terms: boolean;
  created_at: string;
}
