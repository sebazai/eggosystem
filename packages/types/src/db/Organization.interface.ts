export interface Organizations {
  id: number;
  name: string;
  country?: string | null;
  organization_code?: string | null; // Unique but nullable
  logo: string;
  website?: string | null;
}
