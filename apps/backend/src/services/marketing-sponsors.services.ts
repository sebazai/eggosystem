import {
  type GroupedPublicSponsors,
  isGroupedPublicSponsors
} from "@eggosystem/types";
import { loadGroupedPublicSponsors } from "../models/marketing-sponsor.models";
import { expireIn5m, redisClient } from "../utils/redisClient";
import { logger } from "../utils/app-logger";

const REDIS_KEY = "public:marketing-sponsors:v2";

function parseCachedMarketingSponsors(
  cached: string
): GroupedPublicSponsors | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(cached);
  } catch {
    logger.warn("Marketing sponsors cache contained invalid JSON; refreshing");
    return null;
  }
  if (isGroupedPublicSponsors(parsed)) {
    return parsed;
  }
  logger.warn("Invalid marketing sponsors cache payload; refreshing from DB");
  return null;
}

export async function getCachedGroupedPublicSponsors(): Promise<GroupedPublicSponsors> {
  const cached = await redisClient.get(REDIS_KEY);
  if (cached) {
    const validated = parseCachedMarketingSponsors(cached);
    if (validated) {
      return validated;
    }
  }

  const fresh = await loadGroupedPublicSponsors();
  await redisClient.set(REDIS_KEY, JSON.stringify(fresh), "EX", expireIn5m);
  return fresh;
}

export async function invalidatePublicMarketingSponsorsCache(): Promise<void> {
  await redisClient.del(REDIS_KEY);
}
