import { type Request, type Response, type NextFunction } from "express";
import {
  getSeasons,
  getSeasonById,
  getSeasonDetailsById
} from "../models/season.models";
import _ from "lodash";
import { NotFoundError } from "../utils/errors";
import { getFaceitLinksForSeason } from "../models/faceit.models";
import { getActiveOrPassedSeasonId } from "../services/season.services";
import { getTeamCaptainsBySeasonId } from "../models/team.models";

export const getSeasonsController = async (_req: Request, res: Response) => {
  const allSeasons = await getSeasons();
  res.json(allSeasons);
};

export const getSeasonByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const season = await getSeasonById(Number(id));
  if (!season) {
    return next(new NotFoundError("Season not found"));
  }
  res.json(season);
};

export const getSeasonDetailsByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const season = await getSeasonDetailsById(Number(id));
  if (!season) {
    return next(new NotFoundError("Season not found"));
  }
  res.json(season);
};

export const getFaceitLinksForSeasonController = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const seasonId = await getActiveOrPassedSeasonId(req.params.season_id);
  const faceitLinks = await getFaceitLinksForSeason(seasonId);
  res.json(faceitLinks);
};

export const getTeamCaptainsBySeasonIdController = async (
  req: Request,
  res: Response
) => {
  const seasonId = await getActiveOrPassedSeasonId(req.params.season_id);
  const captains = await getTeamCaptainsBySeasonId(seasonId);
  res.json(captains);
};
