import { type Request, type Response, type NextFunction } from "express";
import {
  getAllRegisteredPlayersForSeason,
  getAllPlayersFromSteamPlayers
} from "../models/kanaelo.models";
import { bulkPublishKanaeloCalculationRequests } from "../services/rabbitmq.services";
import type { RequestWithParams } from "@eggosystem/types";
import { BadRequestError, NotFoundError } from "../utils/errors";
import { calculateKanaElo } from "../services/csrankker.services";
import { upsertPlayerKanaElo } from "../models/steam-player-kana-elo.models";
import {
  getLatestSeasonForPlayer,
  updateSeasonPlayerRankKanaElo
} from "../models/season-player-ranks.models";
import { logger } from "../utils/app-logger";

/**
 * Controller to populate the kanaelo queue for all players in a season
 * This fetches all players in the given season and adds them to the kanaelo calculation queue
 */
export const populateKanaeloQueueController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const seasonId = Number(req.params.season_id);

  if (isNaN(seasonId)) {
    throw new BadRequestError("Invalid season ID");
  }

  const players = await getAllRegisteredPlayersForSeason(seasonId);

  if (players.length === 0) {
    return next(new NotFoundError(`No players found for season ${seasonId}`));
  }

  const result = await bulkPublishKanaeloCalculationRequests(players, seasonId);

  res.json({
    message: `Successfully added ${result.published} players to the kanaelo calculation queue`,
    season_id: seasonId,
    total_players: players.length,
    queued_players: result.published,
    failed_players: result.total - result.published
  });
};

/**
 * Controller to calculate kana_elo for all players using CSRankker API
 * Updates SteamPlayerKanaElo (live value) and the player's latest SeasonPlayerRanks row
 * Processes players in batches of 100 using Promise.all
 */
export const calculateKanaEloForAllPlayersController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get all players from SteamPlayers table
    const players = await getAllPlayersFromSteamPlayers();

    if (players.length === 0) {
      return next(new NotFoundError("No players found in SteamPlayers table"));
    }

    let successful = 0;
    let failed = 0;
    const errors: Array<{ steam_id: string; error: string }> = [];

    const BATCH_SIZE = 100;

    logger.info(`[KanaElo] Starting bulk calculation for ${players.length}`);

    // Process players in batches
    for (let i = 0; i < players.length; i += BATCH_SIZE) {
      const batch = players.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(players.length / BATCH_SIZE);

      logger.info(
        `[KanaElo] Processing batch ${batchNumber}/${totalBatches} (${batch.length} players)`
      );

      // Process batch in parallel using Promise.all
      const batchResults = await Promise.all(
        batch.map(async (steamId) => {
          try {
            const seasonId = await getLatestSeasonForPlayer(steamId);

            // Call CSRankker API
            const result = await calculateKanaElo(
              steamId,
              seasonId ?? undefined
            );

            if (!result || result.status !== "success") {
              return {
                success: false,
                steam_id: steamId,
                error: "CSRankker API returned unsuccessful response"
              };
            }

            // Update live elo and sync latest season snapshot when present
            await upsertPlayerKanaElo(steamId, result.result.stabilizedKanaelo);
            if (seasonId != null) {
              await updateSeasonPlayerRankKanaElo(
                steamId,
                seasonId,
                result.result.stabilizedKanaelo
              );
            }

            return {
              success: true,
              steam_id: steamId
            };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            return {
              success: false,
              steam_id: steamId,
              error: errorMessage
            };
          }
        })
      );

      // Process batch results
      for (const result of batchResults) {
        if (result.success) {
          successful++;
        } else {
          failed++;
          errors.push({
            steam_id: result.steam_id,
            error: result.error || "Unknown error"
          });
          logger.warn(
            `[KanaElo] Failed to calculate for steam_id: ${result.steam_id}`
          );
        }
      }

      logger.info(
        `[KanaElo] Batch ${batchNumber}/${totalBatches} completed: ${successful} successful, ${failed} failed (${successful + failed}/${players.length} total)`
      );
    }

    logger.info(
      `[KanaElo] Bulk calculation completed: ${successful} successful, ${failed} failed`
    );

    res.json({
      message: `Successfully calculated kana_elo for ${successful} players (${failed} failed)`,
      total_players: players.length,
      successful,
      failed,
      errors: errors.slice(0, 50) // Limit errors in response to first 50
    });
  } catch (error) {
    logger.error("[KanaElo] Error in bulk calculation", error);
    return next(error);
  }
};
