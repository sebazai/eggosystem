import { type Request, type Response } from "express";
import { getLeagues } from "../models/league.models";

export const getAllLeagues = async (req: Request, res: Response) => {
  const allLeagues = await getLeagues();
  res.json(allLeagues);
};
