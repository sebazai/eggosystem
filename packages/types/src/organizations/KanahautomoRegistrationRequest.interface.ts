import type { InsertOrganization } from "./InsertOrganization.interface";

export interface KanahautomoRegistrationRequestBody {
  organizationId?: number; // If provided, use existing organization
  newOrganization?: InsertOrganization; // If provided, create new organization
  gameTypes: {
    cs: boolean;
    pubgSquad: boolean;
    csWingman: boolean;
    pubgDuo: boolean;
    rocketLeague: boolean;
    dota: boolean;
  };
  acceptedTerms: boolean;
}

export interface KanahautomoRegistrationResponse {
  message: string;
  registrationId: number;
  organizationId: number;
}
