import { type Response } from "express";
import { type RequestWithParams } from "@eggosystem/types";
import { getMatchGameTeamRoundBreakdown } from "../models/game.models";

export const getMatchGameTeamRoundBreakdownController = async (
  req: RequestWithParams<{ game_id: string }>,
  res: Response
) => {
  const game_id = parseInt(req.params.game_id, 10);
  const teamBreakdown = await getMatchGameTeamRoundBreakdown(game_id);
  if (teamBreakdown.length === 2) {
    throw new Error("Did not find exactly two teams for game round breakdown");
  }
  res.json(teamBreakdown);
};
