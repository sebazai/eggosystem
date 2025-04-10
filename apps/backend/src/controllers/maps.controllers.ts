import { type Request, type Response } from "express";
import { getMaps } from "../models/map.models";

export const getAllMaps = async (req: Request, res: Response) => {
  const allMaps = await getMaps();
  res.json(allMaps);
};
