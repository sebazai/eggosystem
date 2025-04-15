import { type Request, type Response } from "express";
import {
  getLeaderboard,
  getLeaderboardTypes
} from "../models/leaderboards.models";

export const getLeaderboardController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { parsedParams } = req;
  const result = await getLeaderboard(parsedParams);
  res.json(result);
};

export const getMultipleLeaderboardsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { parsedParams } = req;
  const leaderboardTypes = [
    // AVG stats
    "kana_rating",
    "kast",
    "hs_percent",
    "adr",

    // SUM stats
    "kills",
    "assists",
    "deaths",
    "kd",
    "flash_assists",
    "utility_damage",
    "total_damage",
    "awp_kills",
    "headshots",
    "enemies_flashed",
    "mates_flashed",
    "self_flashes",
    "clutches_won",
    "one_v_one_won",
    "first_deaths",
    "first_kills",
    "flashes_thrown",
    "total_ef_duration"
  ]; // Add more as needed

  const results = await Promise.all(
    leaderboardTypes.map((lb) =>
      getLeaderboard({ ...parsedParams, leaderboards: lb })
    )
  );

  const response = leaderboardTypes.reduce(
    (acc, leaderboardType, index) => {
      acc[leaderboardType] = results[index];
      return acc;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {} as { [key: string]: any[] }
  );

  res.json(response);
};

export const getLeaderboardTypesController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const types = getLeaderboardTypes();
  res.json(types);
};
