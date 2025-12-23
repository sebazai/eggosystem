import {
  type SeasonPlayerRank,
  type CS2LeetifyAvgRank,
  SeasonPlatform
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import _ from "lodash";
import { expireIn30Days, redisClient } from "../utils/redisClient";
import {
  getPlayerHoursForSeason,
  getPlayerRankForSeason,
  getPlayerKanaElo,
  getTopXPlayersKanaElo
} from "../models/season-player-ranks.models";
import { getCS2RankFromLeetify } from "./leetify.services";
import { getFaceITCS2Rank } from "./faceit.services";
import { getSteamHoursForAppId } from "./steam.services";
import { BadRequestError } from "../utils/errors";
import { logger } from "../utils/app-logger";
import { type FaceITCSRank } from "@eggosystem/types";

const getPlayerHoursForCS = async (steam_id: string, season_id?: number) => {
  const redisKey = `730-${steam_id}-hours`;
  // Return rank for season_id from db, i.e. if admin has added manually
  if (season_id) {
    const hoursFromDb = await getPlayerHoursForSeason(steam_id, season_id);
    const hours = hoursFromDb?.hours;
    if (hours && hours > 0) {
      return { hours };
    }
  }

  const hoursInRedis = await redisClient.get(redisKey);
  if (hoursInRedis) {
    const hoursNumber = Number(hoursInRedis);
    if (hoursNumber > 0) {
      return { hours: hoursNumber };
    }
  }

  const steamHours = await getSteamHoursForAppId(steam_id, 730);
  if (!steamHours || steamHours.playtime_forever === 0) {
    return { hours: -1 };
  }

  const hoursFromSteam = Math.round(steamHours.playtime_forever / 60);
  await redisClient.set(redisKey, hoursFromSteam, "EX", expireIn30Days);

  return { hours: hoursFromSteam };
};

export const getPlayerHoursForSteamAppId = async (
  steam_id: string,
  app_id: number,
  season_id?: number
) => {
  switch (app_id) {
    case 730: // CS
      return getPlayerHoursForCS(steam_id, season_id);
    default:
      throw new BadRequestError("Unknown app_id");
  }
};

export const getPlayerAppIdRank = async (
  steam_id: string,
  app_id: number,
  season_id?: number
) => {
  switch (app_id) {
    case 730: // CS
      return getCSRank(steam_id, season_id);
    default:
      throw new BadRequestError("Unknown app_id");
  }
};

/**
 * Try to get rank from database for a specific season
 */
const getRankFromDatabase = async (
  steam_id: string,
  season_id: number
): Promise<CS2LeetifyAvgRank | null> => {
  const rankFromDb = await getPlayerRankForSeason(steam_id, season_id);
  if (rankFromDb?.average_rank) {
    logger.info(
      `[Rank] Found rank in database for steam_id: ${steam_id}, season_id: ${season_id} - rank: ${rankFromDb.average_rank}`
    );
    return rankFromDb;
  }

  return null;
};

/**
 * Try to get rank from Redis cache
 */
const getRankFromCache = async (
  steam_id: string
): Promise<CS2LeetifyAvgRank | null> => {
  const redisKey = `730-${steam_id}-rank`;
  const rankInRedis = await redisClient.get(redisKey);

  if (rankInRedis) {
    logger.info(`[Rank] Found cached rank for steam_id: ${steam_id}`);
    return JSON.parse(rankInRedis) as CS2LeetifyAvgRank;
  }

  return null;
};

/**
 * Cache rank data in Redis
 * Wraps caching in try-catch to ensure it never fails the main operation
 */
const cacheRankData = async (
  steam_id: string,
  rankData: CS2LeetifyAvgRank
): Promise<void> => {
  try {
    const redisKey = `730-${steam_id}-rank`;
    await redisClient.set(
      redisKey,
      JSON.stringify(rankData),
      "EX",
      expireIn30Days
    );
    logger.debug(`[Rank] Cached rank data for steam_id: ${steam_id}`);
  } catch (error) {
    // Log error but don't fail - caching is best effort
    logger.warn(
      `[Rank] Failed to cache rank data for steam_id: ${steam_id}`,
      error
    );
  }
};

/**
 * Get rank from external sources (Leetify)
 * Always caches successful fetches to Redis, regardless of user existence in DB
 */
const getRankFromExternalSources = async (
  steam_id: string
): Promise<CS2LeetifyAvgRank | null> => {
  const leetifyRank = await getCS2RankFromLeetify(steam_id);
  if (leetifyRank) {
    // Always cache successful fetches to Redis, even if user doesn't exist in DB
    // This prevents unnecessary API calls and rate limiting
    await cacheRankData(steam_id, leetifyRank);
    logger.info(
      `[Rank] Fetched and cached rank from Leetify for steam_id: ${steam_id}, rank: ${leetifyRank.average_rank}`
    );
    return leetifyRank;
  }

  // Log when external source fails (could be rate limit, network error, or no data)
  // Check logs for [Leetify] prefix to see specific error details
  logger.debug(
    `[Rank] External source (Leetify) returned no rank for steam_id: ${steam_id}. ` +
      `Will fall back to database if available. Check [Leetify] logs for error details.`
  );

  return null;
};

/**
 * Get rank from database fallback (latest season)
 */
const getRankFromDatabaseFallback = async (
  steam_id: string
): Promise<CS2LeetifyAvgRank | null> => {
  logger.info(`[Rank] Trying database fallback for steam_id: ${steam_id}`);

  // Fetch only 6 months old ranks, rank_updated_at
  const result = await runQuery<
    Array<{
      cs2_rank: SeasonPlayerRank["cs2_rank"];
      rank_updated_at: SeasonPlayerRank["rank_updated_at"];
    }>
  >(
    `SELECT cs2_rank, rank_updated_at
      FROM SeasonPlayerRanks
      WHERE steam_id = ? AND rank_updated_at > DATE_SUB(NOW(), INTERVAL 6 MONTH)
      ORDER BY season_id DESC LIMIT 1`,
    [steam_id]
  );

  const firstEntry = result[0];
  if (!firstEntry || !firstEntry.cs2_rank) {
    return null;
  }

  const data = {
    average_rank: firstEntry.cs2_rank,
    rank_updated_at: firstEntry.rank_updated_at
  } satisfies CS2LeetifyAvgRank;

  await cacheRankData(steam_id, data);
  logger.info(
    `[Rank] Found fallback rank for steam_id: ${steam_id} - rank: ${data.average_rank}, updated at: ${data.rank_updated_at}`
  );
  return data;
};

/**
 * Main function to get CS2 rank for a player
 * Tries multiple sources in order: Database -> Cache -> External API -> Database Fallback
 */
export const getCSRank = async (
  steam_id: string,
  season_id?: number
): Promise<CS2LeetifyAvgRank> => {
  try {
    // 1. Try database first if season_id is provided
    if (season_id) {
      const dbRank = await getRankFromDatabase(steam_id, season_id);
      if (dbRank) {
        return dbRank;
      }
    }
    // 2. Try Redis cache
    const cachedRank = await getRankFromCache(steam_id);
    if (cachedRank) {
      return cachedRank;
    }

    // 3. Try external sources (Leetify)
    const externalRank = await getRankFromExternalSources(steam_id);
    if (externalRank) {
      return externalRank;
    }

    // 4. Try database fallback
    // Note: If Leetify returned 429 (rate limit), we're falling back to database/cache
    // This is expected behavior to avoid hitting rate limits
    const fallbackRank = await getRankFromDatabaseFallback(steam_id);
    if (fallbackRank) {
      logger.info(
        `[Rank] Using database fallback for steam_id: ${steam_id} after external source failure. ` +
          `This may indicate rate limiting - check [Leetify] logs for 429 errors.`
      );
      return fallbackRank;
    }

    logger.warn(
      `[Rank] No rank found for steam_id: ${steam_id} from any source (database, cache, external API, or fallback). ` +
        `If Leetify returned 429, consider checking Redis cache or waiting before retrying.`
    );
    return {
      average_rank: -1,
      rank_updated_at: null
    } satisfies CS2LeetifyAvgRank;
  } catch (error) {
    logger.error(
      `[Rank] Error during rank lookup for steam_id: ${steam_id}`,
      error
    );

    // Return default rank on error
    return {
      average_rank: -1,
      rank_updated_at: null
    } satisfies CS2LeetifyAvgRank;
  }
};

export const getPlayerRankForPlatform = async (
  steam_id: string,
  platform: SeasonPlatform | null,
  season_id?: number
): Promise<FaceITCSRank | { kana_elo: number } | null> => {
  if (!platform) {
    return null;
  }
  switch (platform) {
    case SeasonPlatform.FACEIT:
      return getFaceITCS2Rank(steam_id, season_id);
    case SeasonPlatform.Kanaliiga: {
      const kanaElo = await getPlayerKanaElo(steam_id);
      if (kanaElo) {
        if (kanaElo.kana_elo <= 0) {
          throw new BadRequestError("Invalid kana_elo: value must be positive");
        }
        return { kana_elo: kanaElo.kana_elo };
      }
      return null;
    }
    default:
      throw new BadRequestError("Unknown platform");
  }
};

// Kanarank rank configuration based on elo thresholds
const KANARANK_THRESHOLDS = [
  { rank: "COCK", subrank: 1, min_elo: 320 }, // COCK_1: 320+ elo
  { rank: "COCK", subrank: 2, min_elo: 300 }, // COCK_2: 300-319 elo
  { rank: "COCK", subrank: 3, min_elo: 280 }, // COCK_3: 280-299 elo
  { rank: "CHICKEN", subrank: 1, min_elo: 250 }, // CHICKEN_1: 250-279 elo
  { rank: "CHICKEN", subrank: 2, min_elo: 220 }, // CHICKEN_2: 220-249 elo
  { rank: "CHICKEN", subrank: 3, min_elo: 185 }, // CHICKEN_3: 185-219 elo
  { rank: "CHICK", subrank: 1, min_elo: 145 }, // CHICK_1: 145-184 elo
  { rank: "CHICK", subrank: 2, min_elo: 120 }, // CHICK_2: 120-144 elo
  { rank: "CHICK", subrank: 3, min_elo: 100 }, // CHICK_3: 100-119 elo
  { rank: "EGG", subrank: 1, min_elo: 85 }, // EGG_1: 85-99 elo
  { rank: "EGG", subrank: 2, min_elo: 60 }, // EGG_2: 60-84 elo
  { rank: "EGG", subrank: 3, min_elo: 0 } // EGG_3: 0-59 elo
];

// Top rankings configuration
const TOP_PLAYERS_COUNT = 50; // Total players to track positions for
const TOP_COCK_COUNT = 10; // Only top 10 get the TOP_COCK rank

const getPlayerThreshold = (kana_elo: number) => {
  for (const threshold of KANARANK_THRESHOLDS) {
    if (kana_elo >= threshold.min_elo) {
      return threshold;
    }
  }
  throw new Error("No threshold found");
};
/**
 * Get player's kanarank based on their kana_elo value and position among all players
 */
interface PlayerKanaRank {
  rank: string;
  subrank: number;
  is_top50: boolean;
  position: number | null;
}

export const getPlayerKanaRank = async (steam_id: string) => {
  const playerKanaElo = await getPlayerKanaElo(steam_id);
  if (!playerKanaElo) {
    return null;
  }
  const { kana_elo } = playerKanaElo;

  const topPlayers = await getTopXPlayersKanaElo(TOP_PLAYERS_COUNT);

  const playerPosition = topPlayers.findIndex(
    (player) => player.steam_id === steam_id
  );

  const position = playerPosition + 1;

  if (position <= TOP_COCK_COUNT && position > 0) {
    return {
      rank: "TOP_COCK",
      subrank: 1,
      is_top50: true,
      position: position
    } satisfies PlayerKanaRank;
  }

  const playerThreshold = getPlayerThreshold(kana_elo);

  return {
    rank: playerThreshold.rank,
    subrank: playerThreshold.subrank,
    is_top50: playerPosition !== -1,
    position: playerPosition !== -1 ? position : null
  } satisfies PlayerKanaRank;
};
