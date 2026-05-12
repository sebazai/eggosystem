import type {
  FaceitChampionshipMatchesResponse,
  FaceitChampionshipMatchItem
} from "@eggosystem/types";
import { expireIn7Days, redisClient } from "../utils/redisClient";
import { logger } from "../utils/app-logger";

const CACHE_KEY_PREFIX = "faceit-championship-matches:";
const FACEIT_MATCHES_URL = "https://open.faceit.com/data/v4/championships";
const LIMIT = 100;

const getChampionshipMatchesCacheKey = (championshipId: string): string =>
  `${CACHE_KEY_PREFIX}${championshipId}`;

const isRecord = (u: unknown): u is Record<string, unknown> =>
  typeof u === "object" && u !== null && !Array.isArray(u);

const isFaceitChampionshipMatchItem = (
  u: unknown
): u is FaceitChampionshipMatchItem => {
  if (!isRecord(u)) return false;
  const o = u;
  const teams = o.teams;
  if (!isRecord(teams)) return false;
  const t = teams;
  const faction1 = t.faction1;
  const faction2 = t.faction2;
  if (!isRecord(faction1) || !isRecord(faction2)) return false;
  return (
    typeof o.match_id === "string" &&
    typeof o.round === "number" &&
    typeof o.group === "number" &&
    typeof o.status === "string" &&
    typeof o.best_of === "number" &&
    (o.scheduled_at === undefined || typeof o.scheduled_at === "number") &&
    typeof faction1.faction_id === "string" &&
    typeof faction1.name === "string" &&
    typeof faction2.faction_id === "string" &&
    typeof faction2.name === "string"
  );
};

const isFaceitChampionshipMatchItemArray = (
  u: unknown
): u is FaceitChampionshipMatchItem[] =>
  Array.isArray(u) && u.every(isFaceitChampionshipMatchItem);

const isFaceitChampionshipMatchesResponse = (
  u: unknown
): u is FaceitChampionshipMatchesResponse => {
  if (!isRecord(u)) return false;
  return "items" in u && isFaceitChampionshipMatchItemArray(u.items);
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
