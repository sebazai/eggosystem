import { type Response } from "express";
import { getTeamPlantStats } from "../models/plant-stats.models";
import type { RequestWithParams } from "@eggosystem/types";

export const getTeamPlantStatsController = async (
  req: RequestWithParams<{ teamId: string }>,
  res: Response
): Promise<void> => {
  const teamId = parseInt(req.params.teamId, 10);
  const params = req.parsedParams;

  const plantStats = await getTeamPlantStats(teamId, params);

  res.status(200).json({
    success: true,
    data: plantStats
  });
};
