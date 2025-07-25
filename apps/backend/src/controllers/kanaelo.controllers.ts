import { type Response } from "express";
import { getAllRegisteredPlayersForSeason } from "../models/kanaelo.models";
import { bulkPublishKanaeloCalculationRequests } from "../services/rabbitmq.services";
import type { RequestWithParams } from "@eggosystem/types";
import { BadRequestError } from "../utils/errors";

/**
 * Controller to populate the kanaelo queue for all players in a season
 * This fetches all players in the given season and adds them to the kanaelo calculation queue
 */
export const populateKanaeloQueueController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response
): Promise<void> => {
  const seasonId = Number(req.params.season_id);

  if (isNaN(seasonId)) {
    throw new BadRequestError("Invalid season ID");
  }

  const players = await getAllRegisteredPlayersForSeason(seasonId);

  if (players.length === 0) {
    res.status(404).json({
      message: `No players found for season ${seasonId}`
    });
    return;
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
