import type { MarketingSponsorTier } from "./PublicMarketingSponsor.interface";

export interface MarketingSponsorAdminRow {
  id: number;
  tier: MarketingSponsorTier;
  display_name: string;
  external_url: string | null;
  display_order: number;
  image_phash: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}
