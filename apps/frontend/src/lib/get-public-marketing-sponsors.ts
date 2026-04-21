import { cache } from "react";
import { envConfig } from "@/configs/env";
import type { GroupedPublicSponsors } from "@eggosystem/types";

const empty: GroupedPublicSponsors = {
  game_wide_sponsors: [],
  main_partners: [],
  supporting_organizations: []
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isGroupedPublicSponsors(
  value: unknown
): value is GroupedPublicSponsors {
  if (!isRecord(value)) {
    return false;
  }
  return (
    Array.isArray(value["game_wide_sponsors"]) &&
    Array.isArray(value["main_partners"]) &&
    Array.isArray(value["supporting_organizations"])
  );
}

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
        return empty;
      }
      const data: unknown = await res.json();
      if (!isGroupedPublicSponsors(data)) {
        return empty;
      }
      return data;
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[getPublicMarketingSponsors] fetch failed", err);
      }
      return empty;
    }
  }
);
