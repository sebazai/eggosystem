export interface Organizations {
  id: number;
  name: string;
  logo: string;
  organization_code: string;
  website: string;
  country: string;
  sort_order: number | null;
  /**
   * Discord invite link for the organization (nullable)
   */
  discord_invite_link: string | null;
  /**
   * Organization status: 'pending' for organizations created during signup but not yet approved,
   * 'active' for approved organizations (default)
   */
  status: "pending" | "active";
}
