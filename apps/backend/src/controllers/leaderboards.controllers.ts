import { type Request, type Response, type NextFunction } from "express";
import { getLeaderboard } from "../models/leaderboards.models";
import { type LeaderboardResponse } from "@eggosystem/types";
import { BadRequestError } from "../utils/errors";

export const getFilteredMultipleLeaderboardsController = async (
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
    "total_ef_duration",

    // derived stats
    "kd",

    // New derived stats
    "first_kills_deaths_ratio",
    "kills_per_round",
    "utility_damage_per_round",
    "awp_kills_per_round",
    "assists_per_round",
    "enemies_flashed_per_flash",
    "avg_enemy_flash_time",
    "avg_teammate_flash_time"
  ] as const satisfies readonly (keyof LeaderboardResponse)[];

  const results = await Promise.all(
    leaderboardTypes.map((lb) =>
      getLeaderboard({ ...parsedParams, leaderboards: lb })
    )
  );

  const mergedObject = results.reduce((accumulator, current) => {
    return { ...accumulator, ...current };
  }, {} as LeaderboardResponse);

  res.json(mergedObject);
};

export const getSingleLeaderboardController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { parsedParams } = req;
  const { leaderboards } = req.query;

  if (!leaderboards || typeof leaderboards !== "string") {
    return next(new BadRequestError("Leaderboards type is required"));
  }

  const result = await getLeaderboard({
    ...parsedParams,
    leaderboards: leaderboards as keyof LeaderboardResponse
  });
  res.json(result);
};
