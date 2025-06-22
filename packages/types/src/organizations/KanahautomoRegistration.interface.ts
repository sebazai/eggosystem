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
