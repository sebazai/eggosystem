import type { Organizations, Nullable } from "@eggosystem/types";

export interface Team {
  id: number;
  organization_id?: Nullable<Organizations["id"]>; // Since it's nullable in the database
  name: string;
  team_logo: string;
  org_approved: boolean;
}
