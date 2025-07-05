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
}
