import type {
  GroupedPublicSponsors,
  PublicMarketingSponsor
} from "./PublicMarketingSponsor.interface";
import type { MarketingSponsorAdminRow } from "./MarketingSponsorAdminRow.interface";

export function createMockGroupedPublicSponsors(
  overrides?: Partial<GroupedPublicSponsors>
): GroupedPublicSponsors {
  return {
    game_wide_sponsors: [],
    main_partners: [],
    supporting_organizations: [],
    ...overrides
  };
}

export function createMockPublicMarketingSponsor(
  overrides?: Partial<PublicMarketingSponsor>
): PublicMarketingSponsor {
  return {
    id: 1,
    display_name: "Example",
    external_url: null,
    display_order: 0,
    image_phash: null,
    footer_image_phash: null,
    ...overrides
  };
}

export function createMockMarketingSponsorAdminRow(
  overrides?: Partial<MarketingSponsorAdminRow>
): MarketingSponsorAdminRow {
  return {
    id: 1,
    tier: "main_partner",
    display_name: "Test Partner",
    external_url: "https://example.com",
    display_order: 0,
    image_phash: "abcd1234",
    footer_image_phash: null,
    enabled: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}
