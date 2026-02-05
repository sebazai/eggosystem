import {
  type SeasonPlayerRank,
  type CS2LeetifyAvgRank,
  SeasonPlatform,
  isFaceITCSRank
} from "@eggosystem/types";
import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import _ from "lodash";
import { expireIn30Days, redisClient } from "../utils/redisClient";
import {
  getPlayerHoursForSeason,
  getPlayerRankForSeason,
  getPlayerKanaElo,
  getTopXPlayersKanaElo,
  insertPlayerRankForSeason,
  getLatestSeasonForPlayer
} from "../models/season-player-ranks.models";
import { getCS2RankFromLeetify } from "./leetify.services";
import { getFaceITCS2Rank } from "./faceit.services";
import { getSteamHoursForAppId } from "./steam.services";
import { BadRequestError } from "../utils/errors";
import { logger } from "../utils/app-logger";
import { type FaceITCSRank } from "@eggosystem/types";

/**
 * Validates if a rank value is valid (positive number, not null/undefined/NaN)
 * @param rank - The rank value to validate (can be number, null, or undefined)
 * @returns true if rank is a valid positive number, false otherwise
 */
export const isValidRank = (
  rank: number | null | undefined
): rank is number => {
  return (
    rank !== null &&
    rank !== undefined &&
    typeof rank === "number" &&
    !isNaN(rank) &&
    rank > 0
  );
};

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

interface RankOptions {
  skipExternalCheck?: boolean;
}

export const getPlayerAppIdRank = async (
  steam_id: string,
  app_id: number,
  season_id?: number,
  options?: RankOptions
) => {
  switch (app_id) {
    case 730: // CS
      return getCSRank(steam_id, season_id, options);
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
  if (rankFromDb && isValidRank(rankFromDb.average_rank)) {
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
    try {
      const parsedRank = JSON.parse(rankInRedis) as CS2LeetifyAvgRank;
      if (parsedRank && isValidRank(parsedRank.average_rank)) {
        logger.info(
          `[Rank] Found cached rank for steam_id: ${steam_id}, rank ${parsedRank.average_rank}`
        );
        return parsedRank;
      } else {
        logger.warn(
          `[Rank] Invalid cached rank data for steam_id: ${steam_id}, average_rank: ${parsedRank?.average_rank}. Ignoring cache.`
        );
        return null;
      }
    } catch (error) {
      logger.warn(
        `[Rank] Failed to parse cached rank data for steam_id: ${steam_id}:`,
        error
      );
      return null;
    }
  }

  return null;
};

/**
 * Cache rank data in Redis
 * Wraps caching in try-catch to ensure it never fails the main operation
 * Validates data before caching to prevent corrupted data in Redis
 */
const cacheRankData = async (
  steam_id: string,
  rankData: CS2LeetifyAvgRank
): Promise<void> => {
  if (!rankData || !isValidRank(rankData.average_rank)) {
    logger.warn(
      `[Rank] Attempted to cache invalid rank data for steam_id: ${steam_id}, average_rank: ${rankData?.average_rank}. Skipping cache.`
    );
    return;
  }

  const redisKey = `730-${steam_id}-rank`;
  try {
    await redisClient.set(
      redisKey,
      JSON.stringify(rankData),
      "EX",
      expireIn30Days
    );
    logger.info(`[Rank] Cached rank data for steam_id: ${steam_id}`);
  } catch (error) {
    // Don't fail the main operation if caching fails
    logger.warn(
      `[Rank] Failed to cache rank data for steam_id: ${steam_id}:`,
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
    await cacheRankData(steam_id, leetifyRank);
    logger.info(
      `[Rank] Fetched and cached rank from Leetify for steam_id: ${steam_id}, rank: ${leetifyRank.average_rank}`
    );
    return leetifyRank;
  }
  logger.info(
    `[Rank] External source (Leetify) returned no rank for steam_id: ${steam_id}.`
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
  if (!firstEntry || !isValidRank(firstEntry.cs2_rank)) {
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
 * When skipExternalCheck is true: Redis then DB (season_id or latest season only); never calls Leetify; returns -1 shape if no rank.
 */
export const getCSRank = async (
  steam_id: string,
  season_id?: number,
  options?: RankOptions
): Promise<CS2LeetifyAvgRank> => {
  const skipExternalCheck = options?.skipExternalCheck === true;

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

    if (skipExternalCheck) {
      // Redis + DB only: use season_id or latest season, then return -1 if nothing
      const effectiveSeasonId =
        season_id ?? (await getLatestSeasonForPlayer(steam_id));
      if (effectiveSeasonId) {
        const dbRank = await getRankFromDatabase(steam_id, effectiveSeasonId);
        if (dbRank) {
          return dbRank;
        }
      }
      return {
        average_rank: -1,
        rank_updated_at: null
      } satisfies CS2LeetifyAvgRank;
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
  season_id?: number,
  options?: RankOptions
): Promise<FaceITCSRank | { kana_elo: number } | null> => {
  if (!platform) {
    return null;
  }
  switch (platform) {
    case SeasonPlatform.FACEIT:
      return getFaceITCS2Rank(steam_id, season_id, options);
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
// Updated for Season 17 distribution (697 players, range 29-224, avg 115)
const KANARANK_THRESHOLDS = [
  { rank: "COCK", subrank: 1, min_elo: 190 }, // COCK_1: 190+ elo (~top 3%)
  { rank: "COCK", subrank: 2, min_elo: 180 }, // COCK_2: 180-189 elo (~top 5%)
  { rank: "COCK", subrank: 3, min_elo: 170 }, // COCK_3: 170-179 elo (~top 10%)
  { rank: "CHICKEN", subrank: 1, min_elo: 160 }, // CHICKEN_1: 160-169 elo (~top 15%)
  { rank: "CHICKEN", subrank: 2, min_elo: 145 }, // CHICKEN_2: 145-159 elo (~top 25%)
  { rank: "CHICKEN", subrank: 3, min_elo: 125 }, // CHICKEN_3: 125-144 elo (~top 40%)
  { rank: "CHICK", subrank: 1, min_elo: 110 }, // CHICK_1: 110-124 elo (~top 50%)
  { rank: "CHICK", subrank: 2, min_elo: 90 }, // CHICK_2: 90-109 elo (~top 65%)
  { rank: "CHICK", subrank: 3, min_elo: 75 }, // CHICK_3: 75-89 elo (~top 75%)
  { rank: "EGG", subrank: 1, min_elo: 60 }, // EGG_1: 60-74 elo (~top 85%)
  { rank: "EGG", subrank: 2, min_elo: 45 }, // EGG_2: 45-59 elo (~top 92%)
  { rank: "EGG", subrank: 3, min_elo: 0 } // EGG_3: 0-44 elo (bottom ~8%)
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

/**
 * Ensures player rank data exists in SeasonPlayerRanks for a given season.
 * Checks if data exists and is complete, and if not, fetches from external services
 * and inserts/updates it. This is the same logic used in signup flow.
 *
 * @param steamId The steam ID of the player
 * @param seasonId The season ID
 * @param appId The game app ID (e.g., 730 for CS2)
 * @param platform The season platform (FACEIT, Kanaliiga, etc.)
 * @param connection Optional database connection for transactions
 * @throws BadRequestError if required data cannot be fetched
 */
export const ensurePlayerRankDataExists = async (
  steamId: string,
  seasonId: number,
  appId: number,
  platform: SeasonPlatform | null,
  connection?: PoolConnection
): Promise<void> => {
  // Check if player has all required data in SeasonPlayerRanks
  const checkPlayerQuery = `
    SELECT 
      id, 
      cs2_rank, 
      faceit_level, 
      faceit_elo, 
      cs_hours, 
      kana_elo 
    FROM SeasonPlayerRanks 
    WHERE season_id = ? AND steam_id = ?
  `;
  const existingPlayerResult = await runQuery<
    Array<{
      id: number;
      cs2_rank: number | null;
      faceit_level: number | null;
      faceit_elo: number | null;
      cs_hours: number | null;
      kana_elo: number | null;
    }>
  >(checkPlayerQuery, [seasonId, steamId], connection);

  const existingPlayer =
    existingPlayerResult && existingPlayerResult.length > 0
      ? existingPlayerResult[0]
      : null;

  // If player data is incomplete, fetch it from external services
  if (
    !existingPlayer ||
    existingPlayer.cs2_rank === null ||
    existingPlayer.faceit_level === null ||
    existingPlayer.cs_hours === null
  ) {
    // Fetch data in parallel (same pattern as signup)
    const [rank, { hours }, externalRank] = await Promise.all([
      getPlayerAppIdRank(steamId, appId, seasonId),
      getPlayerHoursForSteamAppId(steamId, appId, seasonId),
      getPlayerRankForPlatform(steamId, platform, seasonId)
    ]);

    // Validate hours
    if (hours === -1) {
      throw new BadRequestError(`Player ${steamId} hours not found.`);
    }

    // Validate rank
    if (rank.average_rank === -1 || !isValidRank(rank.average_rank)) {
      throw new BadRequestError(
        `Player ${steamId} has no app id rank. Found ${rank.average_rank}.`
      );
    }

    // Validate external rank (FaceIT) - optional for Kanaliiga platform
    if (
      externalRank &&
      "faceit_elo" in externalRank &&
      externalRank.faceit_elo === -1 &&
      platform !== SeasonPlatform.Kanaliiga
    ) {
      throw new BadRequestError(`Player ${steamId} has no ${platform} rank.`);
    }

    // Insert or update player rank data
    await insertPlayerRankForSeason(
      steamId,
      seasonId,
      rank.average_rank,
      hours,
      isFaceITCSRank(externalRank)
        ? externalRank
        : {
            faceit_elo: undefined,
            faceit_level: undefined,
            faceit_kd: undefined,
            faceit_date: undefined
          },
      { connection }
    );
  }
};
