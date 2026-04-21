import type { GroupedPublicSponsors } from "@eggosystem/types";
import { loadGroupedPublicSponsors } from "../models/marketing-sponsor.models";
import { expireIn5m, redisClient } from "../utils/redisClient";
import { logger } from "../utils/app-logger";

const REDIS_KEY = "public:marketing-sponsors:v1";

export async function getCachedGroupedPublicSponsors(): Promise<GroupedPublicSponsors> {
  const cached = await redisClient.get(REDIS_KEY);
  if (cached) {
    const parsed: unknown = JSON.parse(cached);
    if (isGroupedPublicSponsors(parsed)) {
      return parsed;
    }
    logger.warn("Invalid marketing sponsors cache payload; refreshing from DB");
  }

  const fresh = await loadGroupedPublicSponsors();
  await redisClient.set(REDIS_KEY, JSON.stringify(fresh), "EX", expireIn5m);
  return fresh;
}

export async function invalidatePublicMarketingSponsorsCache(): Promise<void> {
  await redisClient.del(REDIS_KEY);
}

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
