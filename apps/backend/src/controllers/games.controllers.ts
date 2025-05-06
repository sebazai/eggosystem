import { type Response } from "express";
import { type RequestWithParams } from "@eggosystem/types";
import {
  getGameRoundInfo,
  getGamePlayerStats,
  getGameTeamRoundBreakdown,
  getGameTeamStats,
  getGameTopPlayers
} from "../models/game.models";

export const getGameTeamRoundBreakdownController = async (
  req: RequestWithParams<{ game_id: string }>,
  res: Response
) => {
  const game_id = parseInt(req.params.game_id, 10);
  const teamBreakdown = await getGameTeamRoundBreakdown(game_id);
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

export const getGameTeamStatsController = async (
  req: RequestWithParams<{ match_id: string; game_id: string }>,
  res: Response
) => {
  const game_id = parseInt(req.params.game_id, 10);
  const teamstats = await getGameTeamStats(game_id);
  res.json(teamstats);
};

export const getGamePlayerStatsController = async (
  req: RequestWithParams<{ game_id: string }>,
  res: Response
) => {
  const game_id = parseInt(req.params.game_id, 10);

  const playerstats = await getGamePlayerStats(game_id);

  res.json(playerstats);
};

export const getGameTopPlayersController = async (
  req: RequestWithParams<{ game_id: string }>,
  res: Response
) => {
  const game_id = parseInt(req.params.game_id, 10);
  const topplayers = await getGameTopPlayers(game_id);
  res.json(topplayers);
};
