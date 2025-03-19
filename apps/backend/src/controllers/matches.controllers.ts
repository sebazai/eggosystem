import { type Request, type Response } from "express";
import {
  getMatches,
  getMatchPlayerStats,
  getMatchTeamStats,
  getTopPlayers,
  getMatchesByFilters,
  getMatchGames
} from "../models/match.models";

export const getMatchesController = async (req: Request, res: Response) => {
  const matches = await getMatches(); // Wait for the promise to resolve
  res.status(200).json({ matches });
};

export const getMatchesByFiltersController = async (
  req: Request,
  res: Response
) => {
  // Call the model function with the parameters in the correct order
  const matches = await getMatchesByFilters(req.parsedParams);

  res.json(matches);
};

export const getTopPlayersController = async (req: Request, res: Response) => {
  const game_id: number = parseInt(req.params.game_id, 10);
  const topplayers = await getTopPlayers(game_id);

  res.json(topplayers);
};

export const getMatchPlayerStatsController = async (
  req: Request,
  res: Response
) => {
  const game_id: number = parseInt(req.params.game_id, 10);
  const playerstats = await getMatchPlayerStats(game_id);

  res.json(playerstats);
};

export const getMatchTeamStatsController = async (
  req: Request,
  res: Response
) => {
  const game_id: number = parseInt(req.params.game_id, 10);
  const teamstats = await getMatchTeamStats(game_id);

  res.json(teamstats);
};

export const getMatchGamesController = async (req: Request, res: Response) => {
  const match_id: number = parseInt(req.params.match_id, 10);
  const mapsPlayed = await getMatchGames(match_id);

  res.json(mapsPlayed);
};
