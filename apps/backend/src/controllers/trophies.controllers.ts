import type { Request, Response, NextFunction } from "express";
import {
  getPlayerTrophyAssignments,
  getTeamTrophyAssignments
} from "../services/trophies.services";

/**
 * Get all trophies for a player
 * GET /api/v1/players/:steam_id/trophies
 */
export const getPlayerTrophiesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { steam_id } = req.params;

    if (!steam_id) {
      res.status(400).json({ error: "steam_id is required" });
      return;
    }

    const result = await getPlayerTrophyAssignments(steam_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all trophies for a team
 * GET /api/v1/teams/:team_id/trophies
 */
export const getTeamTrophiesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const teamId = parseInt(req.params.team_id, 10);

    if (isNaN(teamId)) {
      res.status(400).json({ error: "Invalid team_id" });
      return;
    }

    const result = await getTeamTrophyAssignments(teamId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
