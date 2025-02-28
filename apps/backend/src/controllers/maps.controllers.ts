import { Request, Response } from "express";
import { getMaps } from "../models/map.models";

export const fetchMaps = async (req: Request, res: Response) => {
  const allMaps = await getMaps();
  res.json(allMaps);
};
