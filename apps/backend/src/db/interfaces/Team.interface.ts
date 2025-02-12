export interface Team {
  id: number;
  company_id?: number | null; // Since it's nullable in the database
  name: string;
  team_logo?: string | null; // Optional since it's not marked as NOT NULL
  email: string;
}
