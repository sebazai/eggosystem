import type {
  FaceitChampionshipMatchesResponse,
  FaceitChampionshipMatchItem
} from "@eggosystem/types";
import { redisClient } from "../utils/redisClient";
import { expireIn7Days } from "../utils/redisClient";
import { logger } from "../utils/app-logger";

const CACHE_KEY_PREFIX = "faceit-championship-matches:";
const FACEIT_MATCHES_URL = "https://open.faceit.com/data/v4/championships";
const LIMIT = 100;

function getChampionshipMatchesCacheKey(championshipId: string): string {
  return `${CACHE_KEY_PREFIX}${championshipId}`;
}

export async function invalidateChampionshipMatchesCache(
  championshipId: string
): Promise<void> {
  const key = getChampionshipMatchesCacheKey(championshipId);
  await redisClient.del(key);
  logger.info(
    `[Playoff] Invalidated Redis cache for championship ${championshipId}`
  );
}

/**
 * Fetches championship matches from FaceIT API with Redis cache (7 days).
 * Items from API are in reverse order (last game first); returns them in bracket tree order (reversed).
 */
export async function getChampionshipMatchesCached(
  championshipId: string
): Promise<FaceitChampionshipMatchItem[]> {
  const key = getChampionshipMatchesCacheKey(championshipId);
  const cached = await redisClient.get(key);
  if (cached) {
    const parsed = JSON.parse(cached) as FaceitChampionshipMatchItem[];
    return parsed;
  }

  const apiKey = process.env.FACEIT_API_KEY;
  if (!apiKey) {
    throw new Error("FACEIT_API_KEY is required to fetch championship matches");
  }

  const url = `${FACEIT_MATCHES_URL}/${championshipId}/matches?limit=${LIMIT}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    throw new Error(
      `FaceIT API error: ${response.status} ${response.statusText} for ${url}`
    );
  }

  const data = (await response.json()) as FaceitChampionshipMatchesResponse;
  // API returns items in reverse order (last game first); reverse for bracket tree order (first match first).
  const items = [...(data.items ?? [])].reverse();
  await redisClient.set(key, JSON.stringify(items), "EX", expireIn7Days);
  return items;
}
