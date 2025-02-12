export interface Company {
  id: number;
  name: string;
  country?: string | null;
  company_code?: string | null; // Unique but nullable
  logo: string;
  website?: string | null;
}
