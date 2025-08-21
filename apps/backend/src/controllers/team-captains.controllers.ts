import { type Request, type Response, type NextFunction } from "express";
import {
  getTeamCaptainsBySeasonId,
  getTeamCaptainsForActiveSeasonByAppId,
  getAllTeamCaptains
} from "../models/team-captains.models";
import type { RequestWithParams } from "@eggosystem/types";
import { BadRequestError } from "../utils/errors";

/**
 * Get team captains for a specific season
 */
export const getTeamCaptainsBySeasonIdController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const seasonId = Number(req.params.season_id);

  if (isNaN(seasonId) || seasonId <= 0) {
    return next(
      new BadRequestError(`Invalid season ID: ${req.params.season_id}`)
    );
  }

  const captains = await getTeamCaptainsBySeasonId(seasonId);
  res.json(captains);
};

/**
 * Get team captains for all teams
 */
export const getAllTeamCaptainsController = async (
  req: Request,
  res: Response
) => {
  const captains = await getAllTeamCaptains();
  res.json(captains);
};

/**
 * Get team captains for the active season
 */
export const getTeamCaptainsForActiveSeasonController = async (
  req: Request,
  res: Response
) => {
  // Default to CS2 (app_id 730) and Kanaliiga (organizer_id 1)
  const appId = req.query.app_id ? Number(req.query.app_id) : 730;
  const organizerId = req.query.organizer_id
    ? Number(req.query.organizer_id)
    : 1;

  const captains = await getTeamCaptainsForActiveSeasonByAppId(
    appId,
    organizerId
  );
  res.json(captains);
};
