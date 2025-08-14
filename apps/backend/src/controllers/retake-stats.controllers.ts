import { type Response } from "express";
import { getTeamRetakeStats } from "../models/retake-stats.models";
import type { RequestWithParams } from "@eggosystem/types";

export const getTeamRetakeStatsController = async (
  req: RequestWithParams<{ teamId: string }>,
  res: Response
): Promise<void> => {
  const teamId = parseInt(req.params.teamId, 10);
  const params = req.parsedParams;

  const retakeStats = await getTeamRetakeStats(teamId, params);

  res.status(200).json({
    success: true,
    data: retakeStats
  });
};
