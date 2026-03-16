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

const getChampionshipMatchesCacheKey = (championshipId: string): string =>
  `${CACHE_KEY_PREFIX}${championshipId}`;

const isFaceitChampionshipMatchItem = (
  u: unknown
): u is FaceitChampionshipMatchItem => {
  if (typeof u !== "object" || u === null) return false;
  const o = u as Record<string, unknown>;
  const teams = o.teams;
  if (typeof teams !== "object" || teams === null) return false;
  const t = teams as Record<string, unknown>;
  return (
    typeof o.match_id === "string" &&
    typeof o.round === "number" &&
    typeof o.group === "number" &&
    typeof o.status === "string" &&
    typeof o.best_of === "number" &&
    typeof o.scheduled_at === "number" &&
    typeof t.faction1 === "object" &&
    t.faction1 !== null &&
    typeof (t.faction1 as Record<string, unknown>).faction_id === "string" &&
    typeof (t.faction1 as Record<string, unknown>).name === "string" &&
    typeof t.faction2 === "object" &&
    t.faction2 !== null &&
    typeof (t.faction2 as Record<string, unknown>).faction_id === "string" &&
    typeof (t.faction2 as Record<string, unknown>).name === "string"
  );
};

const isFaceitChampionshipMatchItemArray = (
  u: unknown
): u is FaceitChampionshipMatchItem[] =>
  Array.isArray(u) && u.every(isFaceitChampionshipMatchItem);

const isFaceitChampionshipMatchesResponse = (
  u: unknown
): u is FaceitChampionshipMatchesResponse => {
  if (typeof u !== "object" || u === null) return false;
  const o = u as Record<string, unknown>;
  return "items" in o && isFaceitChampionshipMatchItemArray(o.items);
};

export const invalidateChampionshipMatchesCache = async (
  championshipId: string
): Promise<void> => {
  const key = getChampionshipMatchesCacheKey(championshipId);
  await redisClient.del(key);
  logger.info(
    `[Playoff] Invalidated Redis cache for championship ${championshipId}`
  );
};

/**
 * Fetches championship matches from FaceIT API with Redis cache (7 days).
 * API does not guarantee item order. Consumers must order by round, group, and playoff_seed-derived slot (see playoff controller).
 */
export const getChampionshipMatchesCached = async (
  championshipId: string
): Promise<FaceitChampionshipMatchItem[]> => {
  const key = getChampionshipMatchesCacheKey(championshipId);
  const cached = await redisClient.get(key);
  if (cached) {
    const parsed: unknown = JSON.parse(cached);
    if (!isFaceitChampionshipMatchItemArray(parsed)) {
      await redisClient.del(key);
      throw new Error(
        "Cached championship matches data had invalid shape; cache cleared"
      );
    }
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

  const raw: unknown = await response.json();
  if (!isFaceitChampionshipMatchesResponse(raw)) {
    throw new Error(
      "FaceIT championship matches response had unexpected shape"
    );
  }
  const items = raw.items ?? [];
  await redisClient.set(key, JSON.stringify(items), "EX", expireIn7Days);
  return items;
};
