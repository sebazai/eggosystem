import { type Request, type Response } from "express";
import { getSeasons, getSeasonById } from "../models/season.models";

export const fetchSeasons = async (req: Request, res: Response) => {
  const allSeasons = await getSeasons();
  res.json(allSeasons);
};

export const fetchSeasonById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const [season] = await getSeasonById(id);
  if (!season) {
    res.status(404).json({ message: "Season not found" });
    return;
  }
  res.json(season);
};
