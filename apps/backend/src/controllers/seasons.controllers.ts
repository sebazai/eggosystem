import { Request, Response } from "express";
import { getSeasons } from "../models/season.models";

export const fetchSeasons = async (req: Request, res: Response) => {
  const allSeasons = await getSeasons();
  res.json(allSeasons);
};
