import { type Request, type Response, type NextFunction } from "express";
import {
  getSeasons,
  getSeasonById,
  getSeasonDetailsById
} from "../models/season.models";
import _ from "lodash";
import { NotFoundError } from "../utils/errors";

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
