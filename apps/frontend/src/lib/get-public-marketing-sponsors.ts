import { cache } from "react";
import { envConfig } from "@/configs/env";
import type {
  GroupedPublicSponsors,
  PublicMarketingSponsor
} from "@eggosystem/types";
import {
  isGameWideMarketingSponsorsResponse,
  isGroupedPublicSponsors
} from "@eggosystem/types";

const empty: GroupedPublicSponsors = {
  game_wide_sponsors: [],
  main_partners: [],
  supporting_organizations: []
};

const landingGameAbbrev =
  process.env.NEXT_PUBLIC_LANDING_SPONSOR_GAME_ABBREV?.trim() || "CS2";

/**
 * Cached per-request (RSC); aligns with public API `Cache-Control: max-age=300`.
 */
export const getPublicMarketingSponsors = cache(
  async (): Promise<GroupedPublicSponsors> => {
    try {
      const res = await fetch(`${envConfig.API_URL}/api/v1/sponsors`, {
        next: { revalidate: 300 }
      });
      if (!res.ok) {
        console.warn(
          "[getPublicMarketingSponsors] non-OK response",
          res.status,
          res.statusText
        );
        return empty;
      }
      const data: unknown = await res.json();
      if (!isGroupedPublicSponsors(data)) {
        console.warn(
          "[getPublicMarketingSponsors] response failed shape validation"
        );
        return empty;
      }
      return data;
    } catch (err) {
      console.warn("[getPublicMarketingSponsors] fetch failed", err);
      return empty;
    }
  }
);

/**
 * Game-wide (featured) sponsors for a single title, e.g. CS2 on the landing hero.
 */
export const getGameWideMarketingSponsorsForGame = cache(
  async (gameAbbreviation: string): Promise<PublicMarketingSponsor[]> => {
    const abbrev = encodeURIComponent(gameAbbreviation.trim());
    if (!abbrev) {
      return [];
    }
    try {
      const res = await fetch(
        `${envConfig.API_URL}/api/v1/sponsors/games/${abbrev}`,
        { next: { revalidate: 300 } }
      );
      if (!res.ok) {
        console.warn(
          "[getGameWideMarketingSponsorsForGame] non-OK response",
          res.status,
          res.statusText
        );
        return [];
      }
      const data: unknown = await res.json();
      if (!isGameWideMarketingSponsorsResponse(data)) {
        console.warn(
          "[getGameWideMarketingSponsorsForGame] response failed shape validation"
        );
        return [];
      }
      return data.sponsors;
    } catch (err) {
      console.warn("[getGameWideMarketingSponsorsForGame] fetch failed", err);
      return [];
    }
  }
);

export { landingGameAbbrev };
