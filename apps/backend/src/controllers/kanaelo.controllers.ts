import { type Response } from "express";
import { getAllPlayersForSeason } from "../models/kanaelo.models";
import { bulkPublishKanaeloCalculationRequests } from "../services/rabbitmq.services";
import { BadRequestError } from "../utils/errors";
import type { RequestWithParams } from "@eggosystem/types";
import { logger } from "../utils/app-logger";

/**
 * Controller to populate the kanaelo queue for all players in a season
 * This fetches all players in the given season and adds them to the kanaelo calculation queue
 */
export const populateKanaeloQueueController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const seasonId = Number(req.params.season_id);

    if (isNaN(seasonId) || seasonId <= 0) {
      throw new BadRequestError("Invalid season ID");
    }

    // Get all players for the specified season
    const players = await getAllPlayersForSeason(seasonId);

    if (players.length === 0) {
      res.status(404).json({
        message: `No players found for season ${seasonId}`
      });
      return;
    }

    // Publish the players to the kanaelo calculation queue
    const result = await bulkPublishKanaeloCalculationRequests(
      players,
      seasonId
    );

    res.json({
      message: `Successfully added ${result.published} players to the kanaelo calculation queue`,
      season_id: seasonId,
      total_players: players.length,
      queued_players: result.published,
      failed_players: result.total - result.published
    });
  } catch (error) {
    logger.error("Error populating kanaelo queue", error);
    // Let the error handling middleware handle the error
    throw error;
  }
};
