import { type Request, type Response } from "express";
import {
  getMatches,
  getMatchPlayerStats,
  getMatchGamePlayerStats,
  getMatchTeamStats,
  getMatchGameTeamStats,
  getMatchTopPlayers,
  getGameTopPlayers,
  getMatchesByFilters,
  getMatchGames,
  getMatchInfo,
  getMatchRoundInfo,
  getMatch,
  getMatchGame
} from "../models/match.models";
import type { RequestWithParams } from "@eggosystem/types";
import { NotFoundError } from "../utils/errors";

export const getMatchesController = async (req: Request, res: Response) => {
  const matches = await getMatches(); // Wait for the promise to resolve
  res.status(200).json({ matches });
};

export const getMatchController = async (
  req: RequestWithParams<{ match_id: string }>,
  res: Response
) => {
  const matchId = parseInt(req.params.match_id, 10);
  const [match] = await getMatch(matchId);

  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  res.json(match);
};

export const getMatchGameController = async (
  req: RequestWithParams<{ match_id: string; game_id: string }>,
  res: Response
) => {
  const matchId = parseInt(req.params.match_id, 10);
  const gameId = parseInt(req.params.game_id, 10);
  const [matchGame] = await getMatchGame(matchId, gameId);

  if (!matchGame) {
    throw new NotFoundError("Match game not found");
  }

  res.json(matchGame);
};

export const getMatchInfoController = async (
  req: RequestWithParams<{ match_id: string }>,
  res: Response
) => {
  const matchId = parseInt(req.params.match_id, 10);
  const match = await getMatchInfo(matchId);

  if (!match) {
    throw new NotFoundError("Match not found");
  }

  res.json(match);
};

export const getMatchesByFiltersController = async (
  req: Request,
  res: Response
) => {
  // Call the model function with the parameters in the correct order
  const matches = await getMatchesByFilters(req.parsedParams);

  res.json(matches);
};

export const getTopPlayersController = async (
  req: RequestWithParams<{ match_id: string }>,
  res: Response
) => {
  const match_id = parseInt(req.params.match_id, 10);
  const topplayers = await getMatchTopPlayers(match_id);
  res.json(topplayers);
};

export const getGameTopPlayersController = async (
  req: RequestWithParams<{ match_id: string; game_id: string }>,
  res: Response
) => {
  const match_id = parseInt(req.params.match_id, 10);
  const game_id = parseInt(req.params.game_id, 10);
  const topplayers = await getGameTopPlayers(match_id, game_id);
  res.json(topplayers);
};

export const getMatchPlayerStatsController = async (
  req: RequestWithParams<{ match_id: string }>,
  res: Response
) => {
  const match_id = parseInt(req.params.match_id, 10);

  const playerstats = await getMatchPlayerStats(match_id);

  res.json(playerstats);
};

export const getMatchGamePlayerStatsController = async (
  req: RequestWithParams<{ match_id: string; game_id: string }>,
  res: Response
) => {
  const match_id = parseInt(req.params.match_id, 10);
  const game_id = parseInt(req.params.game_id, 10);

  const playerstats = await getMatchGamePlayerStats(match_id, game_id);

  res.json(playerstats);
};

export const getMatchTeamStatsController = async (
  req: RequestWithParams<{ match_id: string }>,
  res: Response
) => {
  const match_id = parseInt(req.params.match_id, 10);
  const teamstats = await getMatchTeamStats(match_id);
  res.json(teamstats);
};

export const getMatchGameTeamStatsController = async (
  req: RequestWithParams<{ match_id: string; game_id: string }>,
  res: Response
) => {
  const match_id = parseInt(req.params.match_id, 10);
  const game_id = parseInt(req.params.game_id, 10);
  const teamstats = await getMatchGameTeamStats(match_id, game_id);
  res.json(teamstats);
};

export const getMatchGamesController = async (
  req: RequestWithParams<{ match_id: string }>,
  res: Response
) => {
  const match_id = parseInt(req.params.match_id, 10);
  const mapsPlayed = await getMatchGames(match_id);

  res.json(mapsPlayed);
};

export const getMatchRoundInfoController = async (
  req: RequestWithParams<{ match_id: string; game_id: string }>,
  res: Response
) => {
  const match_id = parseInt(req.params.match_id, 10);
  const game_id = parseInt(req.params.game_id, 10);
  const roundInfo = await getMatchRoundInfo(match_id, game_id);
  res.json(roundInfo);
};
