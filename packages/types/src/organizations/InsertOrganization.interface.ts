import type { Nullable, Organizations } from "@eggosystem/types";

export interface InsertOrganization {
  name: Organizations["name"];
  organization_code: Organizations["organization_code"];
  website: Organizations["website"];
  logo?: Nullable<Organizations["logo"]>;
  country?: Nullable<Organizations["country"]>;
}
