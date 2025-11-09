import type { Request, Response, NextFunction } from "express";
import {
  getMyTeams,
  getMyTeamsUpcomingMatches
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
