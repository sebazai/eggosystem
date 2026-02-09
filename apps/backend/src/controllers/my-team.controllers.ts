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
 * Accepts optional steam_ids query parameter (comma-separated) to fetch matches for specific players
 * If not provided, defaults to the authenticated user's steam_id
 */
export const getMyTeamsUpcomingMatchesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.auth || req.auth.provider !== "steam") {
    return next(new UnauthorizedError("Unauthorized"));
  }

  // Get steam_ids from query parameter or default to authenticated user's steam_id
  const steamIdsParam = req.query.steam_ids as string | undefined;
  const steamIds = steamIdsParam
    ? steamIdsParam.split(",").map((id) => id.trim())
    : [req.auth.provider_id];

  const matches = await getMyTeamsUpcomingMatches(steamIds);
  res.json({ matches });
};

/**
 * Controller to get FaceIT championships for a specific season and league
 */
export const getMyTeamChampionshipsController = async (
  req: RequestWithParams<{ season_id: string; league_id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const seasonId = parseInt(req.params.season_id);
    const leagueId = parseInt(req.params.league_id);

    if (isNaN(seasonId) || isNaN(leagueId)) {
      res.status(400).json({
        error: "Invalid season_id or league_id"
      });
      return;
    }

    const championships = await getMyTeamChampionships(seasonId, leagueId);
    res.json({ championships: championships || [] });
  } catch (error) {
    next(error);
  }
};
