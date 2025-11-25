import type { Request, Response, NextFunction } from "express";
import type { RequestWithParams } from "@eggosystem/types";
import {
  getMyTeams,
  getMyTeamsUpcomingMatches,
  getMyTeamChampionships
} from "../models/my-team.models";
import { UnauthorizedError } from "../utils/errors";

/**
 * Controller to get all teams for the logged-in user
 */
export const getMyTeamsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.auth || req.auth.provider !== "steam") {
    return next(new UnauthorizedError("Unauthorized"));
  }

  const teams = await getMyTeams(req.auth.provider_id);
  res.json({ teams });
};

/**
 * Controller to get upcoming matches for the logged-in user's teams
 */
export const getMyTeamsUpcomingMatchesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.auth || req.auth.provider !== "steam") {
    return next(new UnauthorizedError("Unauthorized"));
  }

  const matches = await getMyTeamsUpcomingMatches(req.auth.provider_id);
  res.json({ matches });
};

/**
 * Controller to get FaceIT championships for a specific season and league
 */
export const getMyTeamChampionshipsController = async (
  req: RequestWithParams<{ season_id: string; league_id: string }>,
  res: Response
) => {
  const seasonId = parseInt(req.params.season_id);
  const leagueId = parseInt(req.params.league_id);

  const championships = await getMyTeamChampionships(seasonId, leagueId);
  res.json({ championships });
};
