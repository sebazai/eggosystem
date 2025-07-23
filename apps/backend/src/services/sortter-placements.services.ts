import { redisClient, expireIn30Days } from "../utils/redisClient";
import { logger } from "../utils/app-logger";
import type { TeamSortterValues } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

/**
 * Interface for team placement data stored in Redis
 */
export interface TeamPlacement {
  team_id: number;
  team_name: string;
  division: number;
  comments: string;
  original_avg: number;
  original_position: number;
}

/**
 * Redis key for storing team placements
 */
const getTeamPlacementsKey = (seasonId: number) =>
  `sortter:season:${seasonId}:teams`;

/**
 * Redis key for storing finalization status
 */
const getFinalizationStatusKey = (seasonId: number) =>
  `sortter:season:${seasonId}:finalized`;

/**
 * Check if there are teams in the database for this season
 * Used as an additional way to determine if placements are finalized
 */
export const hasSeasonLeagueTeamsForSeason = async (
  seasonId: number
): Promise<boolean> => {
  const query = `
    SELECT COUNT(*) as count
    FROM SeasonLeagueTeams
    WHERE season_id = ?
  `;

  const result = await runQuery<Array<{ count: number }>>(query, [seasonId]);
  return result.length > 0 && result[0].count > 0;
};

/**
 * Save preliminary team placements to Redis
 */
export const savePreliminaryPlacements = async (
  seasonId: number,
  placements: TeamPlacement[]
): Promise<boolean> => {
  const key = getTeamPlacementsKey(seasonId);
  await redisClient.set(key, JSON.stringify(placements), "EX", expireIn30Days);
  logger.info(
    `Saved preliminary placements for season ${seasonId} with ${placements.length} teams`
  );

  // Verify the data was saved
  const savedData = await redisClient.get(key);
  if (savedData) {
    logger.info(
      `Verified Redis save: found ${JSON.parse(savedData).length} teams for season ${seasonId}`
    );
  } else {
    logger.warn(
      `Failed to verify Redis save for season ${seasonId} - no data found after save`
    );
  }
  return true;
};

/**
 * Get preliminary team placements from Redis
 */
export const getPreliminaryPlacements = async (
  seasonId: number
): Promise<TeamPlacement[] | null> => {
  const key = getTeamPlacementsKey(seasonId);
  const data = await redisClient.get(key);

  if (!data) {
    logger.info(`No placements found in Redis for season ${seasonId}`);
    return null;
  }

  logger.info(`Retrieved placements from Redis for season ${seasonId}`);
  return JSON.parse(data) as TeamPlacement[];
};

/**
 * Generate initial placements from team values
 */
export const generateInitialPlacements = (
  teams: TeamSortterValues[]
): TeamPlacement[] => {
  return teams.map((team, index) => ({
    team_id: team.team_id,
    team_name: team.team_name,
    division: Math.floor(index / 12) + 1,
    comments: team.comments || "",
    original_avg: team.avg4,
    original_position: index
  }));
};

/**
 * Delete preliminary team placements from Redis
 */
export const deletePreliminaryPlacements = async (
  seasonId: number
): Promise<boolean> => {
  const key = getTeamPlacementsKey(seasonId);
  await redisClient.del(key);
  logger.info(`Deleted preliminary placements for season ${seasonId}`);
  return true;
};

/**
 * Set the finalization status for a season's placements in Redis
 */
export const setPlacementsFinalized = async (
  seasonId: number,
  isFinalized: boolean
): Promise<boolean> => {
  const key = getFinalizationStatusKey(seasonId);
  await redisClient.set(
    key,
    isFinalized ? "1" : "0",
    "EX",
    expireIn30Days * 3 // Keep finalization status longer than placements
  );
  logger.info(
    `Set finalization status for season ${seasonId} to ${isFinalized}`
  );
  return true;
};

/**
 * Check if a season's placements have been finalized
 */
export const isPlacementsFinalized = async (
  seasonId: number
): Promise<boolean> => {
  const key = getFinalizationStatusKey(seasonId);
  const data = await redisClient.get(key);

  // Check Redis first
  if (data === "1") {
    return true;
  }

  // If not in Redis, check if there are teams in the database
  const hasTeamsInDatabase = await hasSeasonLeagueTeamsForSeason(seasonId);

  if (hasTeamsInDatabase) {
    // If teams exist in the database, consider it finalized
    // Also set the Redis key for future checks
    await setPlacementsFinalized(seasonId, true);
    return true;
  }

  return false;
};
