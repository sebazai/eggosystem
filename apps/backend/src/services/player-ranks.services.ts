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
  getPlayerKanaElo
} from "../models/season-player-ranks.models";
import { getCS2RankFromLeetify } from "./leetify.services";
import { getFaceITCS2Rank } from "./faceit.services";
import { getSteamHoursForAppId } from "./steam.services";
import { BadRequestError } from "../utils/errors";
import { logger } from "../utils/app-logger";

const getPlayerHoursForCS = async (steam_id: string, season_id?: number) => {
  const redisKey = `730-${steam_id}-hours`;
  // Return rank for season_id from db, i.e. if admin has added manually
  if (season_id) {
    const hoursFromDb = await getPlayerHoursForSeason(steam_id, season_id);
    if (hoursFromDb && hoursFromDb.hours !== -1) {
      await redisClient.set(redisKey, hoursFromDb.hours, "EX", expireIn30Days);
      return hoursFromDb;
    }
  }

  const hoursInRedis = await redisClient.get(redisKey);
  if (hoursInRedis) {
    return { hours: Number(hoursInRedis) };
  }

  const steamHours = await getSteamHoursForAppId(steam_id, 730);
  if (!steamHours) {
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
  if (rankFromDb) {
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
 */
const cacheRankData = async (
  steam_id: string,
  rankData: CS2LeetifyAvgRank
): Promise<void> => {
  const redisKey = `730-${steam_id}-rank`;
  await redisClient.set(
    redisKey,
    JSON.stringify(rankData),
    "EX",
    expireIn30Days
  );
  logger.debug(`[Rank] Cached rank data for steam_id: ${steam_id}`);
};

/**
 * Get rank from external sources (Leetify)
 */
const getRankFromExternalSources = async (
  steam_id: string
): Promise<CS2LeetifyAvgRank | null> => {
  const leetifyRank = await getCS2RankFromLeetify(steam_id);
  if (leetifyRank) {
    await cacheRankData(steam_id, leetifyRank);
    return leetifyRank;
  }

  return null;
};

/**
 * Get rank from database fallback (latest season)
 */
const getRankFromDatabaseFallback = async (
  steam_id: string
): Promise<CS2LeetifyAvgRank | null> => {
  logger.info(`[Rank] Trying database fallback for steam_id: ${steam_id}`);

  const result = await runQuery<
    Array<{
      cs2_rank: SeasonPlayerRank["cs2_rank"];
      rank_updated_at: SeasonPlayerRank["rank_updated_at"];
    }>
  >(
    "SELECT cs2_rank, rank_updated_at FROM SeasonPlayerRanks WHERE steam_id = ? ORDER BY season_id DESC",
    [steam_id]
  );

  if (!_.isEmpty(result)) {
    const cs2RanksInKanaliiga = result
      .filter(
        (
          rank
        ): rank is {
          cs2_rank: number;
          rank_updated_at: SeasonPlayerRank["rank_updated_at"];
        } => rank.cs2_rank !== null && rank.cs2_rank > 0
      )
      .sort((a, b) => {
        if (a.rank_updated_at === null) return 1;
        if (b.rank_updated_at === null) return -1;

        return (
          new Date(b.rank_updated_at).getTime() -
          new Date(a.rank_updated_at).getTime()
        );
      });

    if (cs2RanksInKanaliiga.length > 0) {
      const totalSkillLevel = cs2RanksInKanaliiga.reduce(
        (sum, g) => sum + g.cs2_rank,
        0
      );

      const averageSkillLevel = totalSkillLevel / cs2RanksInKanaliiga.length;
      const data = {
        average_rank: Math.round(averageSkillLevel),
        rank_updated_at: cs2RanksInKanaliiga[0].rank_updated_at
      } satisfies CS2LeetifyAvgRank;

      await cacheRankData(steam_id, data);
      logger.info(
        `[Rank] Found fallback rank for steam_id: ${steam_id} - rank: ${data.average_rank}`
      );
      return data;
    }
  }

  return null;
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
    const fallbackRank = await getRankFromDatabaseFallback(steam_id);
    if (fallbackRank) {
      return fallbackRank;
    }

    logger.warn(`[Rank] No rank found for steam_id: ${steam_id}`);
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
) => {
  if (!platform) {
    return null;
  }
  switch (platform) {
    case SeasonPlatform.FACEIT:
      return getFaceITCS2Rank(steam_id, season_id);
    case SeasonPlatform.Kanaliiga:
      return null;
    default:
      throw new BadRequestError("Unknown platform");
  }
};

// Kanarank rank configuration
const KANARANKS = [
  { name: "EGG", thresholds: [0, 33, 67] },
  { name: "CHICK", thresholds: [100, 134, 167] },
  { name: "CHICKEN", thresholds: [200, 234, 267] },
  { name: "COCK", thresholds: [300, 334, 367] }
];

// Top rankings configuration
const TOP_PLAYERS_COUNT = 50; // Total players to track positions for
const TOP_COCK_COUNT = 10; // Only top 10 get the TOP_COCK rank

/**
 * Get player's kanarank based on their kana_elo value and position among all players
 */
export const getPlayerKanaRank = async (steam_id: string) => {
  // Get the player's kana_elo
  const { kana_elo } = await getPlayerKanaElo(steam_id);

  // Default response structure
  const response: {
    rank: string;
    subrank: number;
    is_top50: boolean;
    position: number | null;
  } = {
    rank: "",
    subrank: 0,
    is_top50: false,
    position: null
  };

  // Get top 50 players by kana_elo
  const topPlayers = await runQuery<
    Array<{ steam_id: string; kana_elo: number }>
  >(
    `SELECT steam_id, kana_elo 
     FROM SeasonPlayerRanks 
     GROUP BY steam_id
     ORDER BY kana_elo DESC
     LIMIT ?`,
    [TOP_PLAYERS_COUNT]
  );

  // Find player position in top players
  const playerPosition = topPlayers.findIndex(
    (player) => player.steam_id === steam_id
  );

  // Player is in top 50
  if (playerPosition !== -1) {
    const position = playerPosition + 1; // +1 because array is 0-indexed
    response.position = position;
    response.is_top50 = true;

    // Only top 10 get the special TOP_COCK rank
    if (position <= TOP_COCK_COUNT) {
      response.rank = "TOP_COCK";
      return response;
    }

    // For positions 11-50, determine their regular rank but include position
    // Fall through to regular rank determination
  }

  // Determine regular rank based on kana_elo
  for (const rank of KANARANKS) {
    // Check if player's elo is in this rank's range
    if (kana_elo <= rank.thresholds[2]) {
      response.rank = rank.name;

      // Determine subrank
      if (kana_elo <= rank.thresholds[0]) {
        response.subrank = 1;
      } else if (kana_elo <= rank.thresholds[1]) {
        response.subrank = 2;
      } else {
        response.subrank = 3;
      }

      return response;
    }
  }

  // If player's elo is higher than any defined rank but not in top 10,
  // assign highest regular rank
  response.rank = "COCK";
  response.subrank = 3;
  return response;
};
