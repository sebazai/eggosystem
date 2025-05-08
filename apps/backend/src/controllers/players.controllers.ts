import { type Request, type Response } from "express";
import {
  getPlayerDetailsBySteamId,
  getMultiplePlayerStatsByFilters,
  getPlayerStatsWithFilters,
  getPlayerBySteamId,
  getPlayerMatchHistoryByFilters,
  getPlayerGameDetailsWithFilters,
  getPlayerTeamDetailsWithFilters
} from "../models/player.models";

import {
  getPlayerHoursForSteamAppId,
  getPlayerAppIdRank,
  getPlayerRankForPlatform
} from "../services/player-ranks.services";
import { isSeasonPlatform, type RequestWithParams } from "@eggosystem/types";
import { isSteamProfilePublic } from "../services/steam.services";

export const getPlayerBySteamIdController = async (
  req: RequestWithParams<{ steam_id: string }>,
  res: Response
) => {
  const steam_id = req.params.steam_id;
  const [player] = await getPlayerBySteamId(steam_id);
  if (!player) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  res.json(player);
};

export const getPlayerDetailsBySteamIdController = async (
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
  const app_id = Number(req.params.app_id);
  const season_id = req.query.season_id?.toString()
    ? parseInt(req.query.season_id.toString(), 10)
    : undefined;

  if (season_id && isNaN(season_id)) {
    throw new Error("Season id query param is not a number.");
  }

  const hours = await getPlayerHoursForSteamAppId(steam_id, app_id, season_id);
  res.status(200).json(hours);
};

/**
 * @param res Return cs2_rank = -1 if rank cannot be determined
 */
export const getPlayerSteamAppIdRank = async (req: Request, res: Response) => {
  const steam_id = req.params.steam_id;
  const app_id = Number(req.params.app_id);
  const season_id = req.query.season_id?.toString()
    ? parseInt(req.query.season_id.toString(), 10)
    : undefined;

  if (season_id && isNaN(season_id)) {
    throw new Error("Season id query param is not a number.");
  }
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

export const getFilteredPlayersStatsController = async (
  req: Request,
  res: Response
) => {
  const { parsedParams } = req;

  const playerStats = await getMultiplePlayerStatsByFilters(parsedParams);

  res.status(200).json(playerStats);
};

export const getFilteredPlayerMatchHistoryController = async (
  req: RequestWithParams<{ steam_id: string }>,
  res: Response
) => {
  const { steam_id } = req.params;
  const { parsedParams } = req;

  const matchHistory = await getPlayerMatchHistoryByFilters(
    steam_id,
    parsedParams
  );

  if (!matchHistory) {
    res.status(404).json({
      error: "Player match history not found."
    });
    return;
  }

  res.status(200).json(matchHistory);
};

export const getFilteredPlayerTeamDetailsController = async (
  req: RequestWithParams<{ steam_id: string }>,
  res: Response
) => {
  const { steam_id } = req.params;
  const { parsedParams } = req;

  const playerTeamDetails = await getPlayerTeamDetailsWithFilters(
    steam_id,
    parsedParams
  );

  res.status(200).json(playerTeamDetails);
};

export const getFilteredPlayerGameDetailsController = async (
  req: RequestWithParams<{ steam_id: string }>,
  res: Response
) => {
  const { steam_id } = req.params;
  const { parsedParams } = req;

  const playerDetails = await getPlayerGameDetailsWithFilters(
    steam_id,
    parsedParams
  );

  // This should never happen...
  if (playerDetails.length > 1) {
    throw new Error("Player details length should only be one");
  }

  const [data] = playerDetails;
  res.status(200).json(data);
};

export const getFilteredPlayerStatisticsController = async (
  req: RequestWithParams<{ steam_id: string }>,
  res: Response
): Promise<void> => {
  const { steam_id } = req.params;
  const { parsedParams } = req;

  const playerStats = await getPlayerStatsWithFilters(steam_id, parsedParams);

  res.status(200).json(playerStats ?? {});
};
