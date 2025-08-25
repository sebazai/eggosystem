import { type Request, type Response, type NextFunction } from "express";
import {
  getFaceitLinksForSeason,
  getFaceitLinksForActiveSeason
} from "../models/faceit-links.models";

export const getFaceitLinksForSeasonController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const seasonId = parseInt(req.params.season_id);
    if (isNaN(seasonId)) {
      return next(new Error("Invalid season ID"));
    }

    const faceitLinks = await getFaceitLinksForSeason(seasonId);
    res.json(faceitLinks);
  } catch (error) {
    next(error);
  }
};

export const getFaceitLinksForActiveSeasonController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const faceitLinks = await getFaceitLinksForActiveSeason();
    res.json(faceitLinks);
  } catch (error) {
    next(error);
  }
};
