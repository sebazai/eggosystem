import { type Response, type NextFunction } from "express";
import { type RequestWithParams } from "@eggosystem/types";
import {
  getGameRoundInfo,
  getGamePlayerStats,
  getGameTeamRoundBreakdown,
  getGameTopPlayers,
  getGameClip
} from "../models/match-game.models";
import { BadRequestError, NotFoundError } from "../utils/errors";
import { getTeamStats } from "../models/match.models";

export const getGameTeamRoundBreakdownController = async (
  req: RequestWithParams<{ match_game_id: string }>,
  res: Response
) => {
  const match_game_id = parseInt(req.params.match_game_id, 10);
  const teamBreakdown = await getGameTeamRoundBreakdown(match_game_id);
  if (teamBreakdown.length !== 2) {
    throw new Error(
      `Did not find exactly two teams for game round breakdown: ${match_game_id}`
    );
  }
  res.json(teamBreakdown);
};

export const getGameRoundInfoController = async (
  req: RequestWithParams<{ match_game_id: string }>,
  res: Response
) => {
  const match_game_id = parseInt(req.params.match_game_id, 10);
  const roundInfo = await getGameRoundInfo(match_game_id);
  res.json(roundInfo);
};

export const getGameTeamStatsController = async (
  req: RequestWithParams<{ match_id: string; match_game_id: string }>,
  res: Response
) => {
  const match_game_id = parseInt(req.params.match_game_id, 10);
  if (isNaN(match_game_id)) {
    throw new BadRequestError("Invalid match game ID");
  }
  const teamstats = await getTeamStats({ match_game_id });
  res.json(teamstats);
};

export const getGamePlayerStatsController = async (
  req: RequestWithParams<{ match_game_id: string }>,
  res: Response
) => {
  const match_game_id = parseInt(req.params.match_game_id, 10);
  const stat = req.query.stat as "CT" | "T" | undefined;

  const playerstats = await getGamePlayerStats(match_game_id, stat);

  res.json(playerstats);
};

export const getGameTopPlayersController = async (
  req: RequestWithParams<{ match_game_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const match_game_id = parseInt(req.params.match_game_id, 10);
  const topplayers = await getGameTopPlayers(match_game_id);
  if (!topplayers) {
    return next(
      new NotFoundError("Could not find top players for match game id")
    );
  }
  res.json(topplayers);
};

export const getGameClipController = async (
  req: RequestWithParams<{ match_game_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const match_game_id = parseInt(req.params.match_game_id, 10);
  const clip = await getGameClip(match_game_id);
  if (clip.length === 0) {
    return next(new NotFoundError("Clip not found"));
  } else {
    res.json(clip[0]);
  }
};
