/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import {
  getPlayers,
  getPlayerBySteamId,
  getPlayersByFilters,
} from "../models/player.models";

export const getPlayersController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const players = await getPlayers();
  res.status(200).json({ players });
};

export const getPlayerBySteamIdController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const steam_id = req.params.steam_id;
  const player = await getPlayerBySteamId(steam_id);

  if (!player) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.status(200).json({ player });
};

export const getPlayersByFiltersController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { season_id, map, league_id, stage, team_id } = (req as any)
    .parsedParams;

  // Call the model function with the parameters in the correct order
  const players = await getPlayersByFilters(
    team_id,
    season_id,
    map,
    league_id,
    stage,
  );

  // Return the players as a response
  res.json(players);
};

export const getPlayerLeaderboardController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { season_id, map, league_id, stage, team_id, leaderboard } = (
    req as any
  ).parsedParams;
  // const result = await getPlayerLeaderboard(
  //   leaderboard,
  //   team_id,
  //   season_id,
  //   map,
  //   league_id,
  //   stage,
  // );
  // res.json(result);
};

export const getMultipleLeaderboardsController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // const { parsedParams } = req;
  // const leaderboards = [
  //   "kills",
  //   "assists",
  //   "deaths",
  //   "kast",
  //   "kd",
  //   "flash_assists",
  // ]; // Add more as needed
  // const results = await Promise.all(
  //   leaderboards.map((leaderboard) =>
  //     getPlayerLeaderboard(
  //       leaderboard,
  //       parsedParams.team_id,
  //       parsedParams.season_id,
  //       parsedParams.map_id,
  //       parsedParams.league_id,
  //       parsedParams.stage,
  //     ),
  //   ),
  // );
  // const response = leaderboards.reduce(
  //   (acc, leaderboard, index) => {
  //     acc[leaderboard] = results[index];
  //     return acc;
  //   },
  //   {} as { [key: string]: any[] },
  // );
  // res.json(response);
};
