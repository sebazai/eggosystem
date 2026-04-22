import type { MarketingSponsorTier } from "./PublicMarketingSponsor.interface";

export interface MarketingSponsorAdminRow {
  id: number;
  tier: MarketingSponsorTier;
  /** Required when `tier` is `game_wide`; otherwise null. */
  game_id: number | null;
  /** Present when `game_id` is set (joined from `Games`). */
  game_abbreviation: string | null;
  display_name: string;
  external_url: string | null;
  display_order: number;
  image_phash: string | null;
  footer_image_phash: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}
