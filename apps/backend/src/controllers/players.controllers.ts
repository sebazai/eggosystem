import { type Request, type Response } from "express";
import {
  getPlayerDetailsBySteamId,
  getPlayersByFilters,
  getPlayerDetailsWithStatsByFilters
} from "../models/player.models";

import {
  getPlayerHoursForSteamAppId,
  getPlayerAppIdRank,
  getPlayerRankForPlatform
} from "../services/player-ranks.services";
import { isSeasonPlatform, RequestWithParams } from "@eggosystem/types";
import { isSteamProfilePublic } from "../services/steam.services";

export const getPlayerBySteamIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const steam_id = req.params.steam_id;
  const player = await getPlayerDetailsBySteamId(steam_id);

  if (!player) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.status(200).json(player);
};

export const getIsPlayerProfilePublic = async (req: Request, res: Response) => {
  const steam_id = req.params.steam_id;
  const isPublic = await isSteamProfilePublic(steam_id);
  res.status(200).json({ public: isPublic });
};

/**
 * @param res Return hours = -1 if hours cannot be determined
 */
export const getPlayerSteamAppIdHours = async (req: Request, res: Response) => {
  const steam_id = req.params.steam_id;
  const app_id = req.params.app_id;
  const season_id = req.query.season_id?.toString();
  const hours = await getPlayerHoursForSteamAppId(steam_id, app_id, season_id);
  res.status(200).json(hours);
};

/**
 * @param res Return cs2_rank = -1 if rank cannot be determined
 */
export const getPlayerSteamAppIdRank = async (req: Request, res: Response) => {
  const steam_id = req.params.steam_id;
  const app_id = req.params.app_id;
  const season_id = req.query.season_id?.toString();
  const rank = await getPlayerAppIdRank(steam_id, app_id, season_id);
  res.status(200).json(rank);
};

export const getPlayerPlatformRank = async (req: Request, res: Response) => {
  const steam_id = req.params.steam_id;
  const platform = req.params.platform;
  const isSeasonPlatformEnum = isSeasonPlatform(platform);
  if (isSeasonPlatformEnum) {
    const platform_rank = await getPlayerRankForPlatform(steam_id, platform);
    res.status(200).json(platform_rank);
    return;
  }
  res.status(400).json({ message: "Unknown platform enum" });
};

/**
 * Get player stats with filters
 * @route GET /api/v1/players/stats
 */
export const getPlayerStatsByFiltersController = async (
  req: Request,
  res: Response
) => {
  const { parsedParams } = req;

  // Fetch player stats from database using the model
  const playerStats = await getPlayersByFilters(parsedParams);

  res.status(200).json(playerStats);
};

/**
 * Get detailed player stats and match history with filters
 * @route GET /api/v1/players/:steam_id/statistics
 */
export const getPlayerDetailsWithStatsController = async (
  req: RequestWithParams<{ steam_id: string }>,
  res: Response
): Promise<void> => {
  const { steam_id } = req.params;
  const { parsedParams } = req;

  const playerDetails = await getPlayerDetailsWithStatsByFilters(
    steam_id,
    parsedParams
  );

  if (!playerDetails.playerStats) {
    res.status(404).json({
      error: "Player not found or no stats match the given filters"
    });
    return;
  }

  res.status(200).json(playerDetails);
};
