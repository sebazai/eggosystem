import {
  type GroupedPublicSponsors,
  isGroupedPublicSponsors,
  isPublicMarketingSponsorList,
  type PublicMarketingSponsor
} from "@eggosystem/types";
import {
  loadGroupedPublicSponsors,
  listEnabledGameWidePublicSponsorsForGameId
} from "../models/marketing-sponsor.models";
import { expireIn5m, redisClient } from "../utils/redisClient";
import { logger } from "../utils/app-logger";

const REDIS_KEY = "public:marketing-sponsors:v3";

function gameWideRedisKey(gameId: number): string {
  return `public:marketing-sponsors:game-wide:gameId:${gameId}:v1`;
}

async function deleteKeysMatching(pattern: string): Promise<void> {
  let cursor = "0";
  do {
    const [next, keys] = await redisClient.scan(
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      200
    );
    cursor = next;
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } while (cursor !== "0");
}

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

function parseCachedGameWideList(
  cached: string
): PublicMarketingSponsor[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(cached);
  } catch {
    logger.warn("Game-wide sponsors cache contained invalid JSON; refreshing");
    return null;
  }
  if (isPublicMarketingSponsorList(parsed)) {
    return parsed;
  }
  logger.warn("Invalid game-wide sponsors cache payload; refreshing from DB");
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

export async function getCachedGameWidePublicSponsorsByGameId(
  gameId: number
): Promise<PublicMarketingSponsor[]> {
  const key = gameWideRedisKey(gameId);
  const cached = await redisClient.get(key);
  if (cached) {
    const validated = parseCachedGameWideList(cached);
    if (validated) {
      return validated;
    }
  }

  const fresh = await listEnabledGameWidePublicSponsorsForGameId(gameId);
  await redisClient.set(key, JSON.stringify(fresh), "EX", expireIn5m);
  return fresh;
}

export async function invalidatePublicMarketingSponsorsCache(): Promise<void> {
  await deleteKeysMatching("public:marketing-sponsors:game-wide:gameId:*");
  await redisClient.del(REDIS_KEY);
}
