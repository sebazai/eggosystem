import { type Request, type Response } from "express";
import {
  getPlayerDetailsBySteamId,
  getPlayersByFilters,
  getPlayerLeaderboard
} from "../models/player.models";

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
