import { Request, Response } from "express";
import {
  getMatches,
  getMatchPlayerStats,
  getMatchTeamStats,
  getTopPlayers,
  getMatchesByFilters
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
  const matchid: number = parseInt(req.params.matchid, 10);
  const topplayers = await getTopPlayers(matchid);

  res.json(topplayers);
};

export const getMatchPlayerStatsController = async (
  req: Request,
  res: Response
) => {
  const matchid: number = parseInt(req.params.matchid, 10);
  const playerstats = await getMatchPlayerStats(matchid);

  res.json(playerstats);
};

export const getMatchTeamStatsController = async (
  req: Request,
  res: Response
) => {
  const matchid: number = parseInt(req.params.matchid, 10);
  const teamstats = await getMatchTeamStats(matchid);

  res.json(teamstats);
};
