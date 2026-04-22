export type MarketingSponsorTier =
  | "game_wide"
  | "main_partner"
  | "supporting_organization";

export interface PublicMarketingSponsor {
  id: number;
  display_name: string;
  external_url: string | null;
  display_order: number;
  /** Image-service perceptual hash; resolve via `/images/by-hash/phash/{image_phash}` */
  image_phash: string | null;
  /**
   * Optional light-on-dark logo for the site footer (`main_partner` tier only).
   * When null or empty, the partner is omitted from the public footer.
   */
  footer_image_phash: string | null;
}

export interface GroupedPublicSponsors {
  /**
   * Always empty from the grouped public cache; game-wide sponsors are loaded
   * per game via `GET /api/v1/sponsors/games/:game_abbreviation`.
   */
  game_wide_sponsors: PublicMarketingSponsor[];
  main_partners: PublicMarketingSponsor[];
  supporting_organizations: PublicMarketingSponsor[];
}

/** Response body for public game-wide sponsors (featured hero, etc.). */
export interface GameWideMarketingSponsorsResponse {
  sponsors: PublicMarketingSponsor[];
}
