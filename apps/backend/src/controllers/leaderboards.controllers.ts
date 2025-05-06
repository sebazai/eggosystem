import { type Request, type Response } from "express";
import { getLeaderboard } from "../models/leaderboards.models";
import { type LeaderboardResponse } from "@eggosystem/types";

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
    "kd"
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
