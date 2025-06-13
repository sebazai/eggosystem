import { type Response } from "express";
import { getTeamPistolWins } from "../models/pistol-wins.models";
import type { RequestWithParams } from "@eggosystem/types";

export const getTeamPistolWinsController = async (
  req: RequestWithParams<{ teamId: string }>,
  res: Response
): Promise<void> => {
  const teamId = parseInt(req.params.teamId, 10);
  const params = req.parsedParams;

  const pistolStats = await getTeamPistolWins(teamId, params);

  res.status(200).json({
    success: true,
    data: pistolStats
  });
};
