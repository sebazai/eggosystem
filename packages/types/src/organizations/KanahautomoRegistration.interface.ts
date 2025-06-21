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
  season_id: number;
  organization_id: number;
  status: "active" | "team_formed";
  created_at: string;
  updated_at?: string;
}
