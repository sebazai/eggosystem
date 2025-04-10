import { type Request, type Response } from "express";
import {
  getPlayerDetailsBySteamId,
  getPlayersByFilters,
  getPlayerLeaderboard
} from "../models/player.models";

import {
  getPlayerHoursForSteamAppId,
  getPlayerAppIdRank,
  getPlayerRankForPlatform
} from "../services/player-ranks.services";
import { isSeasonPlatform } from "@eggosystem/types";
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
  const steam_app_id = req.params.steam_app_id;
  const season_id = req.query.season_id?.toString();
  const hours = await getPlayerHoursForSteamAppId(
    steam_id,
    steam_app_id,
    season_id
  );
  res.status(200).json(hours);
};

/**
 * @param res Return cs2_rank = -1 if rank cannot be determined
 */
export const getPlayerSteamAppIdRank = async (req: Request, res: Response) => {
  const steam_id = req.params.steam_id;
  const steam_app_id = req.params.steam_app_id;
  const season_id = req.query.season_id?.toString();
  const rank = await getPlayerAppIdRank(steam_id, steam_app_id, season_id);
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

export const getPlayersByFiltersController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { parsedParams } = req;
  const players = await getPlayersByFilters(parsedParams);

  // Return the players as a response
  res.json(players);
};

export const getPlayerLeaderboardController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { parsedParams } = req;
  const result = await getPlayerLeaderboard(parsedParams);
  res.json(result);
};

export const getMultipleLeaderboardsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { parsedParams } = req;
  const leaderboards = [
    "kills",
    "assists",
    "deaths",
    "kast",
    "kd",
    "flash_assists"
  ]; // Add more as needed
  const results = await Promise.all(
    leaderboards.map((lb) =>
      getPlayerLeaderboard({ ...parsedParams, leaderboard: lb })
    )
  );
  const response = leaderboards.reduce(
    (acc, leaderboard, index) => {
      acc[leaderboard] = results[index];
      return acc;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {} as { [key: string]: any[] }
  );
  res.json(response);
};
