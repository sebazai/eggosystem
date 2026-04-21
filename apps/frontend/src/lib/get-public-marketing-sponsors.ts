import { cache } from "react";
import { envConfig } from "@/configs/env";
import type { GroupedPublicSponsors } from "@eggosystem/types";
import { isGroupedPublicSponsors } from "@eggosystem/types";

const empty: GroupedPublicSponsors = {
  game_wide_sponsors: [],
  main_partners: [],
  supporting_organizations: []
};

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
