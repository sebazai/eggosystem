#!/usr/bin/env node

/**
 * Backfill script to populate FaceIT data for Season 16 players
 *
 * This script:
 * 1. Fetches all players in Season 16 teams
 * 2. Calls FaceIT API to get player data (nickname and player_id)
 * 3. Updates SteamPlayers table with faceit_nickname and faceit_id
 * 4. Implements 100ms rate limiting between API calls
 * 5. Handles errors gracefully and continues processing
 */

import { runQuery } from "../db/mysqlRunQuery";
import { fetchFaceitPlayerData } from "../services/faceit.services";
import { endDbConnection } from "../db/mysqlConnection";
import { logger } from "../utils/app-logger";

interface Season16Player {
  steam_id: string;
  nickname: string;
  faceit_nickname: string | null;
  faceit_id: string | null;
}

/**
 * Sleep utility for rate limiting
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Get all players in Season 16 teams who don't have FaceIT data yet
 */
const getSeason16Players = async (): Promise<Season16Player[]> => {
  const query = `
    SELECT DISTINCT 
      sp.steam_id,
      sp.nickname,
      sp.faceit_nickname,
      sp.faceit_id
    FROM SteamPlayers sp
    INNER JOIN SeasonTeamPlayers stp ON sp.steam_id = stp.steam_id
    WHERE stp.season_id = 16
      AND (sp.faceit_nickname IS NULL OR sp.faceit_id IS NULL)
    ORDER BY sp.steam_id
  `;

  const players = await runQuery<Season16Player[]>(query);
  logger.info(`Found ${players.length} Season 16 players without FaceIT data`);
  return players;
};

/**
 * Update SteamPlayers table with FaceIT data
 */
const updatePlayerFaceitData = async (
  steamId: string,
  faceitNickname: string,
  faceitId: string
): Promise<void> => {
  const query = `
    UPDATE SteamPlayers 
    SET faceit_nickname = ?, faceit_id = ?
    WHERE steam_id = ?
  `;

  // Ensure steamId is a string to match database format
  const steamIdString = String(steamId);

  await runQuery(query, [faceitNickname, faceitId, steamIdString]);

  logger.info(
    `Updated FaceIT data for player ${steamId}: ${faceitNickname} (${faceitId})`
  );
};

/**
 * Process a single player's FaceIT data
 */
const processPlayer = async (player: Season16Player): Promise<boolean> => {
  try {
    logger.info(`Processing player ${player.steam_id} (${player.nickname})`);

    // Fetch FaceIT data for CS2
    const faceitData = await fetchFaceitPlayerData(player.steam_id, "cs2");

    if (!faceitData) {
      logger.warn(`No FaceIT data found for player ${player.steam_id}`);
      return false;
    }

    // Update database with FaceIT data
    await updatePlayerFaceitData(
      player.steam_id,
      faceitData.nickname,
      faceitData.player_id
    );

    return true;
  } catch (error) {
    logger.error(`Error processing player ${player.steam_id}:`, error);
    return false;
  }
};

/**
 * Main backfill function
 */
const backfillFaceitData = async (): Promise<void> => {
  logger.info("Starting FaceIT data backfill for Season 16 players");

  try {
    // Get all Season 16 players without FaceIT data
    const players = await getSeason16Players();

    if (players.length === 0) {
      logger.info("No players found that need FaceIT data backfill");
      return;
    }

    let processed = 0;
    let successful = 0;
    let failed = 0;

    // Process each player with rate limiting
    for (const player of players) {
      logger.info(
        `Processing ${processed + 1}/${players.length}: ${player.nickname} (${player.steam_id})`
      );

      const success = await processPlayer(player);

      if (success) {
        successful++;
      } else {
        failed++;
      }

      processed++;

      // Rate limiting: 100ms delay between API calls
      if (processed < players.length) {
        await sleep(100);
      }
    }

    logger.info(
      `Backfill completed: ${processed} processed, ${successful} successful, ${failed} failed`
    );
  } catch (error) {
    logger.error("Fatal error during backfill:", error);
    throw error;
  }
};

/**
 * Script entry point
 */
const main = async (): Promise<void> => {
  try {
    await backfillFaceitData();
    logger.info("FaceIT data backfill completed successfully");
  } catch (error) {
    logger.error("FaceIT data backfill failed:", error);
    process.exit(1);
  } finally {
    await endDbConnection();
  }
};

// Run the script if called directly
if (require.main === module) {
  main().catch((error) => {
    logger.error("Unhandled error:", error);
    process.exit(1);
  });
}

export { backfillFaceitData };
