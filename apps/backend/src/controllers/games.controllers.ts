import { type Response } from "express";
import { type RequestWithParams } from "@eggosystem/types";
import {
  getGameRoundInfo,
  getMatchGameTeamRoundBreakdown,
  getMatchGameTeamStats
} from "../models/game.models";

export const getMatchGameTeamRoundBreakdownController = async (
  req: RequestWithParams<{ game_id: string }>,
  res: Response
) => {
  const game_id = parseInt(req.params.game_id, 10);
  const teamBreakdown = await getMatchGameTeamRoundBreakdown(game_id);
  if (teamBreakdown.length !== 2) {
    throw new Error("Did not find exactly two teams for game round breakdown");
  }
  res.json(teamBreakdown);
};

export const getGameRoundInfoController = async (
  req: RequestWithParams<{ game_id: string }>,
  res: Response
) => {
  const game_id = parseInt(req.params.game_id, 10);
  const roundInfo = await getGameRoundInfo(game_id);
  res.json(roundInfo);
};

export const getMatchGameTeamStatsController = async (
  req: RequestWithParams<{ match_id: string; game_id: string }>,
  res: Response
) => {
  const game_id = parseInt(req.params.game_id, 10);
  const teamstats = await getMatchGameTeamStats(game_id);
  res.json(teamstats);
};
