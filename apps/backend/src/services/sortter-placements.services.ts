import { redisClient, expireIn30Days } from "../utils/redisClient";
import { logger } from "../utils/app-logger";
import type { TeamSortterValues } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { getLatestNewsletterConsentBySemverBatch } from "../models/user-policy-acceptance.models";

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

  try {
    // First, check if we already have placements stored
    const existingData = await redisClient.get(key);
    let existingPlacements: TeamPlacement[] = [];

    if (existingData) {
      try {
        existingPlacements = JSON.parse(existingData);
        logger.info(
          `[SortterPlacements] Found existing placements for season ${seasonId}: ${existingPlacements.length} teams`
        );
      } catch (e) {
        logger.error(
          `[SortterPlacements] Error parsing existing placements: ${e}`
        );
      }
    }

    // If we're only updating a subset of teams, merge with existing data
    if (
      existingPlacements.length > 0 &&
      placements.length < existingPlacements.length
    ) {
      logger.info(
        `[SortterPlacements] Partial update detected: ${placements.length} teams vs ${existingPlacements.length} existing`
      );

      // Create a map of team_id to placement for quick lookup
      const placementMap = new Map<number, TeamPlacement>();
      placements.forEach((placement) => {
        placementMap.set(placement.team_id, placement);
      });

      // Update existing placements with new data
      const mergedPlacements = existingPlacements.map((existing) => {
        const updated = placementMap.get(existing.team_id);
        return updated || existing;
      });

      // Save the merged data
      await redisClient.set(
        key,
        JSON.stringify(mergedPlacements),
        "EX",
        expireIn30Days
      );
      logger.info(
        `[SortterPlacements] Merged and saved placements for season ${seasonId} with ${mergedPlacements.length} teams`
      );
    } else {
      // Save the full placement data
      await redisClient.set(
        key,
        JSON.stringify(placements),
        "EX",
        expireIn30Days
      );
      logger.info(
        `[SortterPlacements] Saved full placements for season ${seasonId} with ${placements.length} teams`
      );
    }

    // Verify the data was saved
    const savedData = await redisClient.get(key);
    if (savedData) {
      logger.info(
        `[SortterPlacements] Verified Redis save: found ${JSON.parse(savedData).length} teams for season ${seasonId}`
      );
    } else {
      logger.warn(
        `[SortterPlacements] Failed to verify Redis save for season ${seasonId} - no data found after save`
      );
    }
    return true;
  } catch (error) {
    logger.error(`[SortterPlacements] Error saving placements: ${error}`);
    throw error;
  }
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
    logger.info(
      `[SortterPlacements] No placements found in Redis for season ${seasonId}`
    );
    return null;
  }

  logger.info(
    `[SortterPlacements] Retrieved placements from Redis for season ${seasonId}`
  );
  return JSON.parse(data) as TeamPlacement[];
};

/**
 * Generate initial placements from team values
 */
export const generateInitialPlacements = (
  teams: TeamSortterValues[],
  teamsPerDivision: number
): TeamPlacement[] => {
  return teams.map((team, index) => ({
    team_id: team.team_id,
    team_name: team.team_name,
    division: Math.floor(index / teamsPerDivision) + 1,
    comments: team.comments || "",
    original_avg: team.avg5,
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
  logger.info(
    `[SortterPlacements] Deleted preliminary placements for season ${seasonId}`
  );
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
    `[SortterPlacements] Set finalization status for season ${seasonId} to ${isFinalized}`
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

  if (data === "1") {
    return true;
  }

  const hasTeamsInDatabase = await hasSeasonLeagueTeamsForSeason(seasonId);

  if (hasTeamsInDatabase) {
    await setPlacementsFinalized(seasonId, true);
    return true;
  }

  return false;
};

interface FinalizedPlayer {
  steam_id: string;
  email: string;
  team_name: string;
  league_name: string;
  nickname: string;
  account_id: number;
}

/**
 * Get finalized players with emails and newsletter consent for a season
 * @param seasonId - Season ID
 * @returns Array of players with email, team info, league, and newsletter consent
 */
export const getFinalizedPlayersWithEmailsAndConsent = async (
  seasonId: number
): Promise<Array<FinalizedPlayer>> => {
  // Get all players from finalized season with their account info and league
  const query = `
    SELECT 
      stp.steam_id,
      a.work_email as email,
      a.id as account_id,
      t.name as team_name,
      l.name as league_name,
      sp.nickname
    FROM SeasonTeamPlayers stp
    INNER JOIN SteamPlayers sp ON sp.steam_id = stp.steam_id
    INNER JOIN Accounts a ON a.id = sp.account_id
    INNER JOIN Teams t ON t.id = stp.team_id
    INNER JOIN SeasonLeagueTeams slt ON slt.team_id = t.id AND slt.season_id = stp.season_id
    INNER JOIN Leagues l ON l.id = slt.league_id
    WHERE stp.season_id = ? AND stp.discarded_at IS NULL AND a.work_email_verified = 1
  `;

  const players = await runQuery<Array<FinalizedPlayer>>(query, [seasonId]);

  // Get all account IDs for batch consent check
  const accountIds = players.map((player) => player.account_id);
  const consentMap = await getLatestNewsletterConsentBySemverBatch(accountIds);

  // Filter players with newsletter consent
  const playersWithConsent: Array<FinalizedPlayer> = [];

  let skippedNoConsent = 0;

  for (const player of players) {
    // Check newsletter consent from map
    const hasConsent = consentMap.get(player.account_id) ?? false;

    if (!hasConsent) {
      skippedNoConsent++;
      logger.warn(
        `Player ${player.nickname} (${player.steam_id}) has not accepted tournament newsletter, skipping welcome email`
      );
      continue;
    }

    playersWithConsent.push({
      steam_id: player.steam_id,
      email: player.email,
      team_name: player.team_name,
      league_name: player.league_name,
      nickname: player.nickname,
      account_id: player.account_id
    });
  }

  logger.info(
    `Finalized players for season ${seasonId}: ${playersWithConsent.length} eligible for welcome email, ${skippedNoConsent} without consent`
  );

  return playersWithConsent;
};
