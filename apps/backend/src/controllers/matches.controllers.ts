import { type Request, type Response } from "express";
import {
  getMatches,
  getMatchPlayerStats,
  getMatchTeamStats,
  getTopPlayers,
  getMatchesByFilters,
  getMatchMapsPlayed
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
  const match_played_id: number = parseInt(req.params.match_played_id, 10);
  const topplayers = await getTopPlayers(match_played_id);

  res.json(topplayers);
};

export const getMatchPlayerStatsController = async (
  req: Request,
  res: Response
) => {
  const match_played_id: number = parseInt(req.params.match_played_id, 10);
  const playerstats = await getMatchPlayerStats(match_played_id);

  res.json(playerstats);
};

export const getMatchTeamStatsController = async (
  req: Request,
  res: Response
) => {
  const match_played_id: number = parseInt(req.params.match_played_id, 10);
  const teamstats = await getMatchTeamStats(match_played_id);

  res.json(teamstats);
};

export const getMatchMapsPlayedController = async (
  req: Request,
  res: Response
) => {
  const match_id: number = parseInt(req.params.match_id, 10);
  const mapsPlayed = await getMatchMapsPlayed(match_id);

  res.json(mapsPlayed);
};
